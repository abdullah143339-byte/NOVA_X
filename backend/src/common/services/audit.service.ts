import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource || 'system',
          resourceId: params.resourceId,
          oldValues: params.oldValues || undefined,
          newValues: params.newValues || undefined,
          ipAddress: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch {}
  }

  async logSecurityEvent(params: {
    userId?: string;
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE' | 'TWO_FA_ENABLED' | 'TWO_FA_DISABLED' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED' | 'TOKEN_REFRESH' | 'SESSION_REVOKED' | 'API_KEY_USED' | 'DATA_EXPORT' | 'ACCOUNT_DELETION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    ip?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId: params.userId,
          type: params.type,
          severity: params.severity,
          description: params.description,
          ipAddress: params.ip,
          userAgent: params.userAgent,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : Prisma.JsonNull,
        },
      });
    } catch {}
  }

  async getAuditLogs(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSecurityEvents(userId: string) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
