/**
 * Tạo string ngẫu nhiên với độ dài xác định
 */
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

/**
 * Tạo slug từ string
 */
export function slugify(text: string): string {
  // Chuyển về chữ thường và loại bỏ dấu
  let slug = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Thay thế ký tự đặc biệt bằng dấu gạch ngang
    .replace(/[^\w\s-]/g, '')
    // Thay thế space và những ký tự liên tiếp bằng dấu gạch ngang
    .replace(/[\s_-]+/g, '-')
    // Loại bỏ dấu gạch ngang ở đầu và cuối
    .replace(/^-+|-+$/g, '');
  
  return slug;
}

/**
 * Tạo initials từ tên người dùng
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  // Tách tên thành các phần
  const nameParts = name.split(' ').filter(part => part.length > 0);
  
  // Nếu không có phần nào
  if (nameParts.length === 0) return '';
  
  // Nếu chỉ có một phần
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  // Lấy chữ cái đầu tiên của phần đầu và phần cuối
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
}

/**
 * Mask email (ví dụ: j***@example.com)
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  
  if (!domain) return email;
  
  // Nếu local part ít hơn 3 ký tự
  if (localPart.length <= 3) {
    return `${localPart.charAt(0)}${'*'.repeat(localPart.length - 1)}@${domain}`;
  }
  
  // Giữ lại 1 ký tự đầu và 1 ký tự cuối, còn lại thay bằng *
  return `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}@${domain}`;
}

/**
 * Mask số điện thoại (ví dụ: 090******89)
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  
  // Loại bỏ tất cả ký tự không phải số
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Nếu số điện thoại quá ngắn
  if (cleanPhone.length <= 4) return cleanPhone;
  
  // Giữ lại 2 số đầu và 2 số cuối
  return `${cleanPhone.substring(0, 2)}${'*'.repeat(cleanPhone.length - 4)}${cleanPhone.substring(cleanPhone.length - 2)}`;
}
