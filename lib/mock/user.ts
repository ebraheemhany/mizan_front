// lib/mock/user.ts
// المستخدم الحالي (وهمي)
// TODO: يتربط بالـ API / الجلسة لما نعمل الـ auth

export const mockUser = {
  name: 'محمد أحمد',
  role: 'owner' as 'owner' | 'accountant' | 'staff',
}