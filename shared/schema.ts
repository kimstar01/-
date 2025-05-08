import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 사용자 역할 열거형 정의
export const roleEnum = pgEnum('role', ['influencer', 'advertiser']);

// 캠페인 카테고리 열거형 정의
export const categoryEnum = pgEnum('category', [
  '전체', 
  '맛집', 
  '카페', 
  '뷰티', 
  '패션', 
  '가전', 
  '배달',
  '앱/웹서비스',
  '육아',
  '운동/건강',
  '기타'
]);

// 신청 상태 열거형 정의
export const applicationStatusEnum = pgEnum('application_status', [
  '대기중',
  '승인됨',
  '거절됨',
  '완료됨'
]);

// 알림 유형 열거형 정의
export const notificationTypeEnum = pgEnum('notification_type', [
  '신청접수',
  '승인알림',
  '거절알림',
  '리뷰승인',
  '포인트적립'
]);

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default('influencer'),
  profileImage: text("profile_image"),
  bio: text("bio"),
  followers: integer("followers").default(0),
  instagramId: text("instagram_id"),
  blogUrl: text("blog_url"),
  twitterId: text("twitter_id"),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 캠페인(광고) 테이블
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  category: categoryEnum("category").notNull(),
  location: text("location").notNull(),
  shopName: text("shop_name").notNull(),
  capacity: integer("capacity").notNull(),
  benefit: text("benefit").notNull(),
  requirement: text("requirement").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  images: text("images").array().notNull(),
  advertiserId: integer("advertiser_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  likeCount: integer("like_count").default(0).notNull(),
});

// 신청 테이블
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id").notNull(),
  status: applicationStatusEnum("status").default('대기중').notNull(),
  message: text("message"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  reviewUrl: text("review_url"),
  reviewSubmittedAt: timestamp("review_submitted_at"),
  pointsAwarded: integer("points_awarded"),
});

// 알림 테이블
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  relatedId: integer("related_id"), // 관련 캠페인이나 신청서 ID
});

// 좋아요 테이블
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 스키마 및 타입 내보내기
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  profileImage: true,
  bio: true,
  followers: true,
  instagramId: true,
  blogUrl: true,
  twitterId: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  title: true,
  description: true,
  thumbnailUrl: true,
  category: true,
  location: true,
  shopName: true,
  capacity: true,
  benefit: true,
  requirement: true,
  startDate: true,
  endDate: true,
  images: true,
  advertiserId: true,
  isActive: true,
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  campaignId: true,
  userId: true,
  message: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  message: true,
  relatedId: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  campaignId: true,
});

// 타입 정의
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
