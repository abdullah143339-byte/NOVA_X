export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };

  static ok<T>(data: T, message = 'Success'): ApiResponseDto<T> {
    return { success: true, message, data };
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number, message = 'Success'): ApiResponseDto<T[]> {
    return {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static error(code: string, message: string, details?: any[]): ApiResponseDto<null> {
    return { success: false, message, data: null, error: { code, message, details } };
  }
}
