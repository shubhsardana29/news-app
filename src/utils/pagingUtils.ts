export interface PagingData<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
  
  export const paginate = <T>(data: T[], page: number, limit: number, total: number): PagingData<T> => {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      page,
      limit,
      total,
      totalPages
    };
  };