export function successResponse(res, data = null, message = 'Operation completed successfully', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse(res, items = [], pagination = {}, message = 'Data retrieved successfully') {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total: pagination.total || items.length,
      page: pagination.page || 1,
      pageSize: pagination.pageSize || items.length,
      totalPages: pagination.totalPages || 1,
    },
  });
}

export function errorResponse(res, message = 'Internal server error', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    error: message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}
