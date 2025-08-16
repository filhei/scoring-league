export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleSupabaseError(error: any): AppError {
  if (error?.code === 'PGRST116') {
    return new AppError('Record not found', 'NOT_FOUND', 404)
  }
  if (error?.code === '23505') {
    return new AppError('Record already exists', 'DUPLICATE', 409)
  }
  if (error?.code === '23503') {
    return new AppError('Referenced record does not exist', 'FOREIGN_KEY_VIOLATION', 400)
  }
  return new AppError('An unexpected error occurred', 'INTERNAL_ERROR', 500)
} 