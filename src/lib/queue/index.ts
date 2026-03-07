/**
 * Système de queue avec BullMQ et Redis
 * Pour les tâches asynchrones (emails, notifications, etc.)
 * 
 * Note: Ce module est optionnel et nécessite Redis.
 * Si Redis n'est pas configuré, les fonctions retournent null.
 */

// Types pour éviter les imports au niveau module
type QueueType = import("bullmq").Queue;
type WorkerType = import("bullmq").Worker;

// Configuration Redis - Lazy initialization pour éviter les erreurs au build
const getConnection = () => {
  const REDIS_HOST = process.env.REDIS_HOST;
  const REDIS_PORT = process.env.REDIS_PORT;
  
  if (!REDIS_HOST || !REDIS_PORT) {
    return null;
  }
  
  return {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT, 10),
  };
};

// ============================================
// QUEUES (Lazy initialization)
// ============================================

let _emailQueue: QueueType | null = null;
let _notificationQueue: QueueType | null = null;
let _reminderQueue: QueueType | null = null;
let _initialized = false;

async function initQueues() {
  if (_initialized) return;
  
  const connection = getConnection();
  if (!connection) return;
  
  const { Queue } = await import("bullmq");
  
  _emailQueue = new Queue("emails", { connection });
  _notificationQueue = new Queue("notifications", { connection });
  _reminderQueue = new Queue("reminders", { connection });
  _initialized = true;
}

export const getEmailQueue = async () => {
  await initQueues();
  return _emailQueue;
};

export const getNotificationQueue = async () => {
  await initQueues();
  return _notificationQueue;
};

export const getReminderQueue = async () => {
  await initQueues();
  return _reminderQueue;
};

// ============================================
// HELPERS
// ============================================

/**
 * Ajouter un job d'email
 */
export async function queueEmail(
  to: string,
  subject: string,
  html: string,
  options?: { delay?: number }
) {
  const queue = await getEmailQueue();
  if (!queue) return null;
  
  return queue.add(
    `email-${Date.now()}`,
    { to, subject, html },
    {
      delay: options?.delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

/**
 * Ajouter un job de notification
 */
export async function queueNotification(
  data: {
    userId: string;
    tenantId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
  },
  options?: { delay?: number }
) {
  const queue = await getNotificationQueue();
  if (!queue) return null;
  
  return queue.add(`notif-${Date.now()}`, data, {
    delay: options?.delay,
    attempts: 2,
  });
}

/**
 * Planifier un rappel FMPA (24h avant)
 */
export async function scheduleReminderFMPA(fmpaId: string, startDate: Date) {
  const queue = await getReminderQueue();
  if (!queue) return null;
  
  const now = new Date();
  const reminderTime = new Date(startDate);
  reminderTime.setHours(reminderTime.getHours() - 24);

  const delay = reminderTime.getTime() - now.getTime();

  if (delay > 0) {
    return queue.add(
      `reminder-fmpa-${fmpaId}`,
      { fmpaId, type: "FMPA_REMINDER" },
      {
        delay,
        attempts: 2,
      }
    );
  }

  return null;
}

// ============================================
// MONITORING
// ============================================

export async function getQueueStats() {
  const emailQueue = await getEmailQueue();
  const notificationQueue = await getNotificationQueue();
  const reminderQueue = await getReminderQueue();
  
  if (!emailQueue || !notificationQueue || !reminderQueue) {
    return {
      emails: null,
      notifications: null,
      reminders: null,
      error: "Redis not configured",
    };
  }
  
  const [emailStats, notifStats, reminderStats] = await Promise.all([
    emailQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    reminderQueue.getJobCounts(),
  ]);

  return {
    emails: emailStats,
    notifications: notifStats,
    reminders: reminderStats,
  };
}

// ============================================
// WORKERS (Only start in worker process)
// ============================================

let _workersInitialized = false;

export async function initWorkers() {
  if (_workersInitialized) return;
  
  const connection = getConnection();
  if (!connection) return;
  
  const { Worker } = await import("bullmq");
  const { sendEmail } = await import("@/lib/email");
  const { createNotification } = await import("@/lib/notifications");
  
  // Email Worker
  const emailWorker = new Worker(
    "emails",
    async (job) => {
      const { to, subject, html } = job.data;
      const success = await sendEmail({ to, subject, html });
      if (!success) throw new Error("Échec envoi email");
      return { success: true, to };
    },
    { connection, concurrency: 5 }
  );
  
  // Notification Worker
  const notificationWorker = new Worker(
    "notifications",
    async (job) => {
      const { userId, tenantId, type, title, message, link, metadata } = job.data;
      await createNotification({ userId, tenantId, type, title, message, link, metadata });
      return { success: true, userId };
    },
    { connection, concurrency: 10 }
  );
  
  // Reminder Worker
  const reminderWorker = new Worker(
    "reminders",
    async (job) => {
      const { fmpaId } = job.data;
      const { prisma } = await import("@/lib/prisma");
      
      const fmpa = await prisma.fMPA.findUnique({
        where: { id: fmpaId },
        include: { participations: { include: { user: true } } },
      });
      
      if (!fmpa) throw new Error("FMPA introuvable");
      
      for (const participation of fmpa.participations) {
        await queueEmail(
          participation.user.email,
          `Rappel : ${fmpa.title}`,
          `<p>Rappel : La FMPA "${fmpa.title}" commence demain.</p>`
        );
        
        await queueNotification({
          userId: participation.user.id,
          tenantId: fmpa.tenantId,
          type: "FMPA_REMINDER",
          title: "Rappel FMPA",
          message: `La FMPA "${fmpa.title}" commence demain`,
          link: `/fmpa/${fmpa.id}`,
        });
      }
      
      return { success: true, count: fmpa.participations.length };
    },
    { connection, concurrency: 2 }
  );
  
  _workersInitialized = true;
}
