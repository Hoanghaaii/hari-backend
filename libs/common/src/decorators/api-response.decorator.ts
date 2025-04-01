// Placeholder decorator để duy trì tính tương thích
// trong trường hợp chúng ta cần thêm swagger sau này
export const ApiSuccessResponse = () => {
  return (target: any, key?: string, descriptor?: any) => {
    return descriptor;
  };
};

export const ApiErrorResponse = () => {
  return (target: any, key?: string, descriptor?: any) => {
    return descriptor;
  };
};

export const ApiCommonResponses = () => {
  return (target: any, key?: string, descriptor?: any) => {
    return descriptor;
  };
};
