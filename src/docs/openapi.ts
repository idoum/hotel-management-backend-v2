/**
 * @file src/docs/openapi.ts
 * @description Spécification OpenAPI 3.0.3 complète pour l'API Hôtel Management :
 *  - Health, Me
 *  - Auth (register/login/logout/forgot/reset/refresh)
 *  - RBAC (roles/permissions/assign/detach)
 *  - PMS (Room Types & Rooms) avec filtres avancés, pagination {data, meta} et export CSV
 *
 * NB: Le contrôle fin des permissions (ex: perm.rbac.manage, perm.rooms.export)
 *     est appliqué côté middleware. La doc le mentionne dans les descriptions.
 */

type AnyObject = Record<string, any>;

/** Construit l’URL de serveur à partir des envs (PORT, API_BASE_PATH). */
function serverUrl(): string {
  const port = process.env.PORT || '3005';
  const base = process.env.API_BASE_PATH || '/api';
  return `http://localhost:${port}${base}`;
}

/** Construit l'objet OpenAPI (JSON sérialisable). */
export function buildOpenApiSpec(): AnyObject {
  /* ===== Components (security + schemas) ===== */

  const bearer: AnyObject = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' };

  const components: AnyObject = {
    securitySchemes: { bearerAuth: bearer },
    schemas: {
      /* ---- Generic ---- */
      ErrorResponse: {
        type: 'object',
        properties: { message: { type: 'string' }, code: { type: 'string', nullable: true }, reqId: { type: 'string', nullable: true } },
        required: ['message']
      },
      HealthResponse: {
        type: 'object',
        properties: { status: { type: 'string', example: 'ok' }, uptime: { type: 'number', example: 123.45 } }
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

      /* ---- Auth ---- */
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
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
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
      AuthLogoutRequest: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] },
      AuthForgotRequest: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
      AuthForgotResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          debug: {
            type: 'object',
            nullable: true,
            properties: { token: { type: 'string' }, expAt: { type: 'string', format: 'date-time' }, resetUrl: { type: 'string' } }
          }
        },
        required: ['message']
      },
      AuthResetRequest: { type: 'object', properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } }, required: ['token', 'password'] },
      AuthRefreshRequest: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] },
      AuthRefreshResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          refreshExpAt: { type: 'string', format: 'date-time' }
        },
        required: ['accessToken', 'refreshToken', 'refreshExpAt']
      },

      /* ---- RBAC ---- */
      Role: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time', nullable: true },
          updated_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      RoleCreateRequest: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string', nullable: true } }, required: ['name'] },
      Permission: { type: 'object', properties: { id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' } } },
      PermissionCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string', nullable: true },
          resource: { type: 'string', nullable: true },
          action: { type: 'string', nullable: true, enum: ['view', 'create', 'update', 'delete', 'export'] }
        },
        required: ['name']
      },
      AssignRoleRequest: { type: 'object', properties: { role_id: { type: 'integer' } }, required: ['role_id'] },
      AttachPermissionRequest: { type: 'object', properties: { permission_id: { type: 'integer' } }, required: ['permission_id'] },

      /* ---- PMS: Room Types ---- */
      RoomType: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          features: { type: 'object', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      RoomTypeCreateRequest: {
        type: 'object',
        properties: {
          code: { type: 'string', nullable: true },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          features: { type: 'object', nullable: true }
        },
        required: ['name']
      },
      RoomTypeUpdateRequest: {
        type: 'object',
        properties: {
          code: { type: 'string', nullable: true },
          name: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          features: { type: 'object', nullable: true }
        }
      },

      /* ---- PMS: Rooms ---- */
      Room: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          number: { type: 'string' },
          floor: { type: 'integer', nullable: true },
          room_type_id: { type: 'integer' },
          status: { type: 'string', enum: ['vacant', 'occupied', 'ooo', 'oos'] },
          out_of_service_reason: { type: 'string', nullable: true },
          oos_since: { type: 'string', format: 'date-time', nullable: true },
          features: { type: 'object', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      RoomCreateRequest: {
        type: 'object',
        properties: {
          number: { type: 'string' },
          floor: { type: 'integer', nullable: true },
          room_type_id: { type: 'integer' },
          status: { type: 'string', enum: ['vacant', 'occupied', 'ooo', 'oos'], nullable: true },
          out_of_service_reason: { type: 'string', nullable: true },
          oos_since: { type: 'string', format: 'date-time', nullable: true },
          features: { type: 'object', nullable: true }
        },
        required: ['number', 'room_type_id']
      },
      RoomUpdateRequest: {
        type: 'object',
        properties: {
          number: { type: 'string', nullable: true },
          floor: { type: 'integer', nullable: true },
          room_type_id: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['vacant', 'occupied', 'ooo', 'oos'], nullable: true },
          out_of_service_reason: { type: 'string', nullable: true },
          oos_since: { type: 'string', format: 'date-time', nullable: true },
          features: { type: 'object', nullable: true }
        }
      },
      RoomsListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' }
            },
            required: ['total', 'limit', 'offset']
          }
        },
        required: ['data', 'meta']
      }
    },
    RatePlan: {
      type: 'object',
      properties: {
        id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, currency: { type: 'string' },
        occupancy_pricing: { type: 'boolean' }, refundable: { type: 'boolean' }, policy: { type: 'string', nullable: true },
        room_type_id: { type: 'integer', nullable: true },
        created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' }
      }
    },
    RatePlanCreateRequest: {
      type: 'object',
      properties: {
        code: { type: 'string', nullable: true }, name: { type: 'string' }, currency: { type: 'string', minLength: 3, maxLength: 3 },
        occupancy_pricing: { type: 'boolean' }, refundable: { type: 'boolean' }, policy: { type: 'string', nullable: true }, room_type_id: { type: 'integer', nullable: true }
      },
      required: ['name']
    },
    RatePlanUpdateRequest: {
      type: 'object',
      properties: {
        code: { type: 'string', nullable: true }, name: { type: 'string', nullable: true }, currency: { type: 'string', minLength: 3, maxLength: 3, nullable: true },
        occupancy_pricing: { type: 'boolean', nullable: true }, refundable: { type: 'boolean', nullable: true },
        policy: { type: 'string', nullable: true }, room_type_id: { type: 'integer', nullable: true }
      }
    },
    PriceUpsertRequest: {
      type: 'object',
      properties: {
        start_date: { type: 'string', format: 'date' }, end_date: { type: 'string', format: 'date' },
        price_base: { type: 'number', format: 'decimal' }, price_extra_adult: { type: 'number', format: 'decimal' }, price_extra_child: { type: 'number', format: 'decimal' },
        closed: { type: 'boolean' }
      },
      required: ['start_date', 'end_date', 'price_base']
    },
    RestrictionSetRequest: {
      type: 'object',
      properties: {
        start_date: { type: 'string', format: 'date' }, end_date: { type: 'string', format: 'date' },
        min_stay: { type: 'integer', nullable: true }, max_stay: { type: 'integer', nullable: true },
        cta: { type: 'boolean', nullable: true }, ctd: { type: 'boolean', nullable: true },
        advance_min: { type: 'integer', nullable: true }, advance_max: { type: 'integer', nullable: true }
      },
      required: ['start_date', 'end_date']
    },
    QuoteRequest: {
      type: 'object',
      properties: {
        rate_plan_id: { type: 'integer' }, check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' },
        adults: { type: 'integer', default: 2 }, children: { type: 'integer', default: 0 }
      },
      required: ['rate_plan_id', 'check_in', 'check_out']
    },
    QuoteNight: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date' }, base: { type: 'number' }, extra_adult: { type: 'number' }, extra_child: { type: 'number' },
        total: { type: 'number' }, closed: { type: 'boolean' }, reason: { type: 'string', nullable: true }
      }
    },
    QuoteResponse: {
      type: 'object',
      properties: {
        plan: { type: 'object', properties: { id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, currency: { type: 'string' } } },
        params: { type: 'object', properties: { check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' }, adults: { type: 'integer' }, children: { type: 'integer' }, nights: { type: 'integer' } } },
        nights: { type: 'array', items: { $ref: '#/components/schemas/QuoteNight' } },
        total: { type: 'number' },
        closed: { type: 'boolean' }
      }
    },
    Reservation: {
      type: 'object',
      properties: {
        id: { type: 'integer' }, code: { type: 'string' }, guest_name: { type: 'string', nullable: true }, guest_email: { type: 'string', nullable: true },
        guest_phone: { type: 'string', nullable: true }, check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' },
        status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'] },
        currency: { type: 'string' }, amount_total: { type: 'string' }, source: { type: 'string', nullable: true }, notes: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' },
        rooms: { type: 'array', items: { $ref: '#/components/schemas/ReservationRoom' } }
      }
    },
    ReservationRoom: {
      type: 'object',
      properties: {
        id: { type: 'integer' }, reservation_id: { type: 'integer' }, room_type_id: { type: 'integer' }, room_id: { type: 'integer', nullable: true },
        rate_plan_id: { type: 'integer', nullable: true }, adults: { type: 'integer' }, children: { type: 'integer' }, qty: { type: 'integer' },
        price_per_night: { type: 'object', additionalProperties: { type: 'number' }, nullable: true },
        amount: { type: 'string' }
      }
    },
    ReservationCreateRequest: {
      type: 'object',
      properties: {
        guest_name: { type: 'string', nullable: true }, guest_email: { type: 'string', format: 'email', nullable: true }, guest_phone: { type: 'string', nullable: true },
        check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' }, currency: { type: 'string' },
        source: { type: 'string', nullable: true }, notes: { type: 'string', nullable: true },
        rooms: {
          type: 'array', items: {
            type: 'object', properties: {
              room_type_id: { type: 'integer' }, rate_plan_id: { type: 'integer', nullable: true }, adults: { type: 'integer' }, children: { type: 'integer' }, qty: { type: 'integer' }
            }
          }
        }
      },
      required: ['check_in', 'check_out', 'rooms']
    },
    ReservationUpdateRequest: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'], nullable: true },
        assign: { type: 'object', nullable: true, properties: { line_id: { type: 'integer' }, room_id: { type: 'integer', nullable: true } } }
      }
    },
    AvailabilitySearchResponse: {
      type: 'object',
      properties: {
        room_type_id: { type: 'integer' }, check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' },
        request_qty: { type: 'integer' }, total_rooms: { type: 'integer' }, min_available: { type: 'integer' }, available: { type: 'boolean' },
        daily: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, available: { type: 'integer' } } } }
      }
    }


  };

  /* ===== Paths ===== */

  const paths: AnyObject = {
    /* ---- Health ---- */
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Healthcheck',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } }
        }
      }
    },

    /* ---- Me ---- */
    '/me': {
      get: {
        tags: ['Me'],
        summary: 'Profil courant (JWT requis)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/MeResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    /* ---- Auth ---- */
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterResponse' } } } },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLogoutRequest' } } } },
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Mot de passe oublié (envoi d’email)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthForgotRequest' } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthForgotResponse' } } } } }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Réinitialiser le mot de passe',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResetRequest' } } } },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renouveler un accessToken avec refreshToken',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRefreshRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRefreshResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    /* ---- RBAC (protégé perm.rbac.manage côté middleware) ---- */
    '/rbac/roles': {
      get: {
        tags: ['RBAC'],
        summary: 'Lister les rôles (permission perm.rbac.manage requise)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Role' } } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      post: {
        tags: ['RBAC'],
        summary: 'Créer un rôle (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } } },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/rbac/permissions': {
      get: {
        tags: ['RBAC'],
        summary: 'Lister les permissions (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Permission' } } } } }
        }
      },
      post: {
        tags: ['RBAC'],
        summary: 'Créer une permission (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PermissionCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Permission' } } } },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/rbac/users/{userId}/roles': {
      post: {
        tags: ['RBAC'],
        summary: 'Assigner un rôle à un utilisateur (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignRoleRequest' } } } },
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rbac/users/{userId}/roles/{roleId}': {
      delete: {
        tags: ['RBAC'],
        summary: 'Révoquer un rôle (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rbac/roles/{roleId}/permissions': {
      post: {
        tags: ['RBAC'],
        summary: 'Attacher une permission à un rôle (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AttachPermissionRequest' } } } },
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rbac/roles/{roleId}/permissions/{permId}': {
      delete: {
        tags: ['RBAC'],
        summary: 'Détacher une permission d’un rôle (permission perm.rbac.manage)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'permId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { 204: { description: 'No Content' } }
      }
    },

    /* ---- PMS: Room Types ---- */
    '/room-types': {
      get: {
        tags: ['PMS – Room Types'],
        security: [{ bearerAuth: [] }],
        summary: 'Lister les types de chambres',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, required: false, description: 'Recherche partielle (code/name)' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer', minimum: 0, default: 0 } }
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RoomType' } } } } }
        }
      },
      post: {
        tags: ['PMS – Room Types'],
        security: [{ bearerAuth: [] }],
        summary: 'Créer un type de chambre',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomTypeCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomType' } } } },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/room-types/{id}': {
      patch: {
        tags: ['PMS – Room Types'],
        security: [{ bearerAuth: [] }],
        summary: 'Mettre à jour un type de chambre',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomTypeUpdateRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomType' } } } },
          404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      delete: {
        tags: ['PMS – Room Types'],
        security: [{ bearerAuth: [] }],
        summary: 'Supprimer un type de chambre',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'No Content' },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    /* ---- PMS: Rooms ---- */
    '/rooms': {
      get: {
        tags: ['PMS – Rooms'],
        security: [{ bearerAuth: [] }],
        summary: 'Lister les chambres (filtres avancés)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, required: false, description: 'Recherche partielle sur le numéro' },
          {
            name: 'status', in: 'query', required: false, description: 'Multi-status (CSV). Ex: vacant,ooo', style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'string', enum: ['vacant', 'occupied', 'ooo', 'oos'] } }
          },
          {
            name: 'room_type_id', in: 'query', required: false, description: 'IDs de type (CSV). Ex: 1,3', style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'integer', format: 'int32' } }
          },
          {
            name: 'floors', in: 'query', required: false, description: 'Liste d’étages (CSV). Ex: 1,2,3', style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'integer' } }
          },
          { name: 'floorMin', in: 'query', required: false, schema: { type: 'integer' }, description: 'Étage minimal (plage)' },
          { name: 'floorMax', in: 'query', required: false, schema: { type: 'integer' }, description: 'Étage maximal (plage)' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer', minimum: 0, default: 0 } },
          {
            name: 'sort', in: 'query', required: false,
            schema: { type: 'string', example: 'number:ASC,floor:DESC,status:ASC' },
            description: 'Tri multi-colonnes (liste blanche: number,floor,status,room_type_id,created_at).'
          }
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomsListResponse' } } } }
        }
      },
      post: {
        tags: ['PMS – Rooms'],
        security: [{ bearerAuth: [] }],
        summary: 'Créer une chambre',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomCreateRequest' } } } },
        responses: {
          201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/rooms/{id}': {
      patch: {
        tags: ['PMS – Rooms'],
        security: [{ bearerAuth: [] }],
        summary: 'Mettre à jour une chambre',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomUpdateRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      delete: {
        tags: ['PMS – Rooms'],
        security: [{ bearerAuth: [] }],
        summary: 'Supprimer une chambre',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'No Content' },
          409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/rooms/export': {
      get: {
        tags: ['PMS – Rooms'],
        security: [{ bearerAuth: [] }],
        summary: 'Exporter les chambres en CSV (mêmes filtres que /rooms) — nécessite perm.rooms.export',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, required: false },
          {
            name: 'status', in: 'query', required: false, style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'string', enum: ['vacant', 'occupied', 'ooo', 'oos'] } }
          },
          {
            name: 'room_type_id', in: 'query', required: false, style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'integer', format: 'int32' } }
          },
          {
            name: 'floors', in: 'query', required: false, style: 'form', explode: false,
            schema: { type: 'array', items: { type: 'integer' } }
          },
          { name: 'floorMin', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'floorMax', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string', example: 'number:ASC,floor:DESC' } }
        ],
        responses: {
          200: { description: 'CSV', content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } } }
        }
      }
    },
    '/rate-plans': {
      get: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Lister les plans tarifaires',
        parameters: [{ name: 'room_type_id', in: 'query', required: false, schema: { type: 'integer' }, description: 'Filtrer par type de chambre' }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RatePlan' } } } } } }
      },
      post: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Créer un plan',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RatePlanCreateRequest' } } } },
        responses: { 201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/RatePlan' } } } } }
      }
    },
    '/rate-plans/{id}': {
      patch: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Mettre à jour un plan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RatePlanUpdateRequest' } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/RatePlan' } } } }, 404: { description: 'Not Found' } }
      },
      delete: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Supprimer un plan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rate-plans/{id}/prices': {
      put: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Upsert prix sur une plage',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PriceUpsertRequest' } } } },
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rate-plans/{id}/restrictions': {
      put: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Définir restrictions sur une plage',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RestrictionSetRequest' } } } },
        responses: { 204: { description: 'No Content' } }
      }
    },
    '/rates/quote': {
      get: {
        tags: ['Rates'], security: [{ bearerAuth: [] }], summary: 'Devis par nuit pour un plan',
        parameters: [
          { name: 'rate_plan_id', in: 'query', required: false, schema: { type: 'integer' }, description: 'ID du plan (prioritaire si fourni)' },
          { name: 'room_type_id', in: 'query', required: false, schema: { type: 'integer' }, description: 'Sélection auto du plan lié à ce RoomType, sinon fallback sur plan global' },
          { name: 'plan_code', in: 'query', required: false, schema: { type: 'string', default: 'BAR' }, description: 'Code préféré (ex: BAR). Utilisé si rate_plan_id non fourni.' },
          { name: 'check_in', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'check_out', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'adults', in: 'query', required: false, schema: { type: 'integer', default: 2 } },
          { name: 'children', in: 'query', required: false, schema: { type: 'integer', default: 0 } }
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/QuoteResponse' } } } } }
      }
    },
    '/availability/search': {
      get: {
        tags: ['Availability'], security: [{ bearerAuth: [] }],
        summary: 'Disponibilité par type et par jour',
        parameters: [
          { name: 'room_type_id', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'check_in', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'check_out', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'rooms', in: 'query', required: false, schema: { type: 'integer', default: 1 } }
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AvailabilitySearchResponse' } } } } }
      }
    },
    '/reservations': {
      get: {
        tags: ['Reservations'], security: [{ bearerAuth: [] }], summary: 'Lister',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reservation' } } } } } }
      },
      post: {
        tags: ['Reservations'], security: [{ bearerAuth: [] }], summary: 'Créer une réservation',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReservationCreateRequest' } } } },
        responses: { 201: { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } } } }
      }
    },
    '/reservations/{id}': {
      get: {
        tags: ['Reservations'], security: [{ bearerAuth: [] }], summary: 'Détail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } } }, 404: { description: 'Not Found' } }
      },
      patch: {
        tags: ['Reservations'], security: [{ bearerAuth: [] }], summary: 'Mettre à jour (statut / assignation)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReservationUpdateRequest' } } } },
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } } } }
      },
      delete: {
        tags: ['Reservations'], security: [{ bearerAuth: [] }], summary: 'Supprimer (pending seulement)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'No Content' }, 409: { description: 'Conflict' } }
      }
    }


  };

  /* ===== OpenAPI root ===== */

  return {
    openapi: '3.0.3',
    info: {
      title: 'Hôtel Management — API',
      description: 'Auth, RBAC, PMS (Rooms/Room Types) avec filtres avancés & export CSV',
      version: '1.2.0'
    },
    servers: [{ url: serverUrl() }],
    tags: [
      { name: 'Health' },
      { name: 'Me' },
      { name: 'Auth' },
      { name: 'RBAC' },
      { name: 'PMS – Room Types' },
      { name: 'PMS – Rooms' }
    ],
    components,
    paths
  };

}



/** Export direct (utilisé par la route /api/docs/json par ex.) */
export const openapiSpec = buildOpenApiSpec();
