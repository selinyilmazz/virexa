export type MockUser = {
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  preferredCategories: string[];
};

export const mockUser: MockUser = {
  name: "Selin Yılmaz",
  email: "selin@example.com",
  avatar: "/images/profile/avatar.jpg",
  joinDate: "March 2024",
  preferredCategories: ["Technology", "AI", "Business"],
};
