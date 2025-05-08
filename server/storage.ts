import { users, campaigns, applications, notifications, likes, type User, type Campaign, type Application, type Notification, type Like, type InsertUser, type InsertCampaign, type InsertApplication, type InsertNotification, type InsertLike } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// 세션 스토어 생성
const MemoryStore = createMemoryStore(session);

// 인터페이스 정의
export interface IStorage {
  // 세션 스토어
  sessionStore: session.SessionStore;

  // 사용자 관련
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;

  // 캠페인 관련
  getCampaigns(): Promise<Campaign[]>;
  getCampaignsByCategory(category: string): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByAdvertiserId(advertiserId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignLikes(campaignId: number, increment: boolean): Promise<Campaign | undefined>;
  updateCampaignViews(campaignId: number): Promise<Campaign | undefined>;

  // 신청서 관련
  getApplications(campaignId: number): Promise<Application[]>;
  getApplicationsByUser(userId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  updateApplicationReview(id: number, reviewUrl: string): Promise<Application | undefined>;

  // 알림 관련
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // 좋아요 관련
  getLike(userId: number, campaignId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  removeLike(userId: number, campaignId: number): Promise<void>;
}

// 인메모리 스토리지 구현
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private campaigns: Map<number, Campaign>;
  private applications: Map<number, Application>;
  private notifications: Map<number, Notification>;
  private likes: Map<number, Like>;
  sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentCampaignId: number;
  private currentApplicationId: number;
  private currentNotificationId: number;
  private currentLikeId: number;

  constructor() {
    this.users = new Map();
    this.campaigns = new Map();
    this.applications = new Map();
    this.notifications = new Map();
    this.likes = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24시간마다 만료된 세션 정리
    });
    this.currentUserId = 1;
    this.currentCampaignId = 1;
    this.currentApplicationId = 1;
    this.currentNotificationId = 1;
    this.currentLikeId = 1;
  }

  // 사용자 관련 메서드
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt, points: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, points: user.points + points };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // 캠페인 관련 메서드
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaignsByCategory(category: string): Promise<Campaign[]> {
    if (category === '전체') {
      return this.getCampaigns();
    }
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.category === category
    );
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByAdvertiserId(advertiserId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.advertiserId === advertiserId
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const createdAt = new Date();
    const campaign: Campaign = { 
      ...insertCampaign, 
      id, 
      createdAt, 
      viewCount: 0, 
      likeCount: 0 
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaignLikes(campaignId: number, increment: boolean): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return undefined;
    
    const updatedLikeCount = increment 
      ? campaign.likeCount + 1 
      : Math.max(0, campaign.likeCount - 1);
    
    const updatedCampaign = { ...campaign, likeCount: updatedLikeCount };
    this.campaigns.set(campaignId, updatedCampaign);
    return updatedCampaign;
  }

  async updateCampaignViews(campaignId: number): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, viewCount: campaign.viewCount + 1 };
    this.campaigns.set(campaignId, updatedCampaign);
    return updatedCampaign;
  }

  // 신청서 관련 메서드
  async getApplications(campaignId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.campaignId === campaignId
    );
  }

  async getApplicationsByUser(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === userId
    );
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const appliedAt = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      appliedAt, 
      status: '대기중',
      reviewUrl: null,
      reviewSubmittedAt: null,
      pointsAwarded: null
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async updateApplicationReview(id: number, reviewUrl: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const reviewSubmittedAt = new Date();
    const updatedApplication = { ...application, reviewUrl, reviewSubmittedAt, status: '완료됨' };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // 알림 관련 메서드
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt, 
      isRead: false 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // 좋아요 관련 메서드
  async getLike(userId: number, campaignId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      (like) => like.userId === userId && like.campaignId === campaignId
    );
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const createdAt = new Date();
    const like: Like = { ...insertLike, id, createdAt };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(userId: number, campaignId: number): Promise<void> {
    const like = await this.getLike(userId, campaignId);
    if (like) {
      this.likes.delete(like.id);
    }
  }
}

export const storage = new MemStorage();
