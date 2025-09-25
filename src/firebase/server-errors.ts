'use server';

// NOTE: This is a simplified, server-only version of the client-side error.
// It does not attempt to access client-side Firebase SDK features like getAuth().

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface SecurityRuleRequest {
  auth: null; // On the server, we cannot reliably get the client's auth state.
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds the simulated request object for the error message.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  return {
    auth: null, // Auth object is omitted on the server.
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class for use on the SERVER.
 * It provides structured error information similar to its client-side counterpart
 * but without relying on client-side SDK features.
 */
export class FirestorePermissionServerError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError'; // Keep the name consistent for error boundaries.
    this.request = requestObject;
  }
}
