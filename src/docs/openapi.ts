/**
 * @file src/docs/openapi.ts
 * @description Définition OpenAPI 3.0.3 (spec JSON) couvrant /health, /me, /auth/*, /rbac/*.
 * Note: on génère le spec en code pour rester typé et proche des modèles.
 */

type AnyObject = Record<string, any>;

/**
 * Construit dynamiquement l'URL serveur à partir de PORT/env.
 */
function serverUrl(): string {
  const port = process.env.PORT || '3005';
  const base = process.env.API_BASE_PATH || '/api';
  return `http://localhost:${port}${base}`;
}

/**
 * Construit et retourne l'objet OpenAPI (3.0.3).
 * Ajoute:
 *  - securitySchemes: bearerAuth (JWT)
 *  - tags: Health, Me, Auth, RBAC
 *  - schemas principaux (User, Role, Permission, etc.)
 *  - paths pour toutes les routes
 */
export function buildOpenApiSpec(): AnyObject {
  const bearer: AnyObject = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  };

  const components: AnyObject = {
    securitySchemes: { bearerAuth: bearer },
    schemas: {
      // ============== Schemas communs ==============
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        },
        required: ['message']
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          uptime: { type: 'number' }
        }
      },
      MeResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string', nullable: true },
          last_name: { type: 'string', nullable: true },
          is_active: { type: 'boolean' },
          roles: { type: 'array', items: { type: 'string' } },
          permissions: { type: 'array', items: { type: 'string' } }
        },
        required: ['id', 'email', 'is_active', 'roles', 'permissions']
      },
      // ============== Users / Auth ==============
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          account_code: { type: 'string', nullable: true },
          first_name: { type: 'string', nullable: true },
          last_name: { type: 'string', nullable: true },
          is_active: { type: 'boolean' },
          last_login_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      AuthRegisterRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          first_name: { type: 'string', nullable: true },
          last_name: { type: 'string', nullable: true }
        },
        required: ['email', 'password']
      },
      AuthRegisterResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          refreshExpAt: { type: 'string', format: 'date-time' }
        },
        required: ['user', 'accessToken', 'refreshToken', 'refreshExpAt']
      },
      AuthLoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      },
      AuthLoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          refreshExpAt: { type: 'string', format: 'date-time' }
        },
        required: ['accessToken', 'refreshToken', 'refreshExpAt']
      },
      AuthLogoutRequest: {
        type: 'object',
        properties: { refreshToken: { type: 'string' } },
        required: ['refreshToken']
      },
      AuthForgotRequest: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' } },
        required: ['email']
      },
      AuthForgotResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          debug: {
            type: 'object',
            nullable: true,
            properties: {
              token: { type: 'string' },
              expAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        required: ['message']
      },
      AuthResetRequest: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 }
        },
        required: ['token', 'password']
      },
      AuthRefreshRequest: {
        type: 'object',
        properties: { refreshToken: { type: 'string' } },
        required: ['refreshToken']
      },
      AuthRefreshResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          refreshExpAt: { type: 'string', format: 'date-time' }
        },
        required: ['accessToken', 'refreshToken', 'refreshExpAt']
      },
      // ============== RBAC ==============
      Role: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time', nullable: true },
          updated_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      RoleCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string', nullable: true }
        },
        required: ['name']
      },
      Permission: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string' },
          name: { type: 'string' }
        }
      },
      PermissionCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string', nullable: true },
          resource: { type: 'string', nullable: true },
          action: { type: 'string', nullable: true, enum: ['view','create','update','delete','export'] }
        },
        required: ['name']
      },
      AssignRoleRequest: {
        type: 'object',
        properties: { role_id: { type: 'integer' } },
        required: ['role_id']
      },
      AttachPermissionRequest: {
        type: 'object',
        properties: { permission_id: { type: 'integer' } },
        required: ['permission_id']
      }
    }
  };

  const paths: AnyObject = {
    // ===== Health
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Healthcheck',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } }
        }
      }
    },

    // ===== Me
    '/me': {
      get: {
        tags: ['Me'],
        summary: 'Profil courant + rôles + permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/MeResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ===== Auth
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterRequest' } } }
        },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterResponse' } } } },
          409: { description: 'Email déjà utilisé', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Connexion (access + refresh tokens)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } }
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginResponse' } } } },
          401: { description: 'Bad credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Déconnexion (révoque le refresh token)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLogoutRequest' } } }
        },
        responses: {
          204: { description: 'No Content' }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Demande de reset de mot de passe',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthForgotRequest' } } }
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthForgotResponse' } } } }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset du mot de passe via token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResetRequest' } } }
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          400: { description: 'Token invalide/expiré', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Échange/rotation du refresh token → nouveau access + refresh',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRefreshRequest' } } }
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRefreshResponse' } } } },
          401: { description: 'Refresh invalide/expiré', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ===== RBAC
    '/rbac/roles': {
      get: {
        tags: ['RBAC'],
        summary: 'Lister les rôles',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Role' } } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      post: {
        tags: ['RBAC'],
        summary: 'Créer un rôle',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/rbac/permissions': {
      get: {
        tags: ['RBAC'],
        summary: 'Lister les permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Permission' } } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      post: {
        tags: ['RBAC'],
        summary: 'Créer une permission',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PermissionCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Permission' } } } }
        }
      }
    },
    '/rbac/users/{userId}/roles': {
      post: {
        tags: ['RBAC'],
        summary: "Assigner un rôle à l'utilisateur",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', schema: { type: 'integer' }, required: true }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignRoleRequest' } } } },
        responses: { 204: { description: 'No Content' }, 403: { description: 'Forbidden' } }
      }
    },
    '/rbac/users/{userId}/roles/{roleId}': {
      delete: {
        tags: ['RBAC'],
        summary: "Révoquer un rôle d'un utilisateur",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', schema: { type: 'integer' }, required: true },
          { name: 'roleId', in: 'path', schema: { type: 'integer' }, required: true }
        ],
        responses: { 204: { description: 'No Content' }, 403: { description: 'Forbidden' } }
      }
    },
    '/rbac/roles/{roleId}/permissions': {
      post: {
        tags: ['RBAC'],
        summary: 'Attacher une permission à un rôle',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'roleId', in: 'path', schema: { type: 'integer' }, required: true }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AttachPermissionRequest' } } } },
        responses: { 204: { description: 'No Content' }, 403: { description: 'Forbidden' } }
      }
    },
    '/rbac/roles/{roleId}/permissions/{permId}': {
      delete: {
        tags: ['RBAC'],
        summary: 'Détacher une permission d’un rôle',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'roleId', in: 'path', schema: { type: 'integer' }, required: true },
          { name: 'permId', in: 'path', schema: { type: 'integer' }, required: true }
        ],
        responses: { 204: { description: 'No Content' }, 403: { description: 'Forbidden' } }
      }
    }
  };

  const spec: AnyObject = {
    openapi: '3.0.3',
    info: {
      title: 'Hôtel Management — API',
      description: 'Documentation des endpoints Auth, RBAC et utilitaires.',
      version: '1.0.0'
    },
    servers: [{ url: serverUrl() }],
    tags: [
      { name: 'Health' },
      { name: 'Me' },
      { name: 'Auth' },
      { name: 'RBAC' }
    ],
    components,
    paths
  };

  return spec;
}

/** Exporte un spec prêt à servir. */
export const openapiSpec = buildOpenApiSpec();
