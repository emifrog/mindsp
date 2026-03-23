/**
 * Types pour le connecteur Microsoft 365 (Graph API)
 *
 * Couvre : Outlook Mail, Calendar, Teams, OneDrive, Azure AD Users
 */

// ═══════════════════════════════════════════
// Configuration Microsoft 365
// ═══════════════════════════════════════════

export interface Microsoft365Config {
  /** Azure AD Tenant ID */
  tenantId: string;
  /** Azure App Client ID */
  clientId: string;
  /** Azure App Client Secret */
  clientSecret: string;
  /** Scopes demandés */
  scopes?: string[];
  /** Mode debug */
  debug?: boolean;
}

// ═══════════════════════════════════════════
// Outlook Mail
// ═══════════════════════════════════════════

export interface MSGraphMail {
  id: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: {
    emailAddress: {
      name: string;
      address: string;
    };
  }[];
  ccRecipients: {
    emailAddress: {
      name: string;
      address: string;
    };
  }[];
  receivedDateTime: string;
  isRead: boolean;
  importance: "low" | "normal" | "high";
  hasAttachments: boolean;
}

export interface MSGraphMailSend {
  subject: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  toRecipients: {
    emailAddress: {
      address: string;
    };
  }[];
  ccRecipients?: {
    emailAddress: {
      address: string;
    };
  }[];
  importance?: "low" | "normal" | "high";
}

// ═══════════════════════════════════════════
// Calendar
// ═══════════════════════════════════════════

export interface MSGraphEvent {
  id: string;
  subject: string;
  body?: {
    contentType: "text" | "html";
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay: boolean;
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees: {
    emailAddress: {
      name: string;
      address: string;
    };
    status: {
      response: "none" | "accepted" | "tentativelyAccepted" | "declined";
    };
    type: "required" | "optional";
  }[];
  categories: string[];
}

export interface MSGraphEventCreate {
  subject: string;
  body?: {
    contentType: "text" | "html";
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay?: boolean;
  attendees?: {
    emailAddress: {
      address: string;
      name?: string;
    };
    type: "required" | "optional";
  }[];
  categories?: string[];
}

// ═══════════════════════════════════════════
// Teams
// ═══════════════════════════════════════════

export interface MSGraphTeamsMessage {
  id: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  from: {
    user: {
      id: string;
      displayName: string;
    };
  };
  createdDateTime: string;
  importance: "normal" | "high" | "urgent";
}

export interface MSGraphTeamsChannel {
  id: string;
  displayName: string;
  description: string;
  membershipType: "standard" | "private" | "shared";
}

export interface MSGraphTeam {
  id: string;
  displayName: string;
  description: string;
}

// ═══════════════════════════════════════════
// OneDrive / SharePoint
// ═══════════════════════════════════════════

export interface MSGraphDriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
  createdBy: {
    user: {
      displayName: string;
    };
  };
  "@microsoft.graph.downloadUrl"?: string;
}

// ═══════════════════════════════════════════
// Azure AD Users
// ═══════════════════════════════════════════

export interface MSGraphUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
}
