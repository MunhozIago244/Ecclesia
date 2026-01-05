import { 
  type User, type InsertUser, 
  type Ministry, type InsertMinistry,
  type Location, type InsertLocation,
  type Equipment, type InsertEquipment,
  type Service, type InsertService,
  type Event, type InsertEvent,
  type Schedule, type InsertSchedule,
  type ScheduleAssignment, type InsertScheduleAssignment,
  users, ministries, locations, equipments, services, events, schedules, scheduleAssignments, ministryMembers
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Ministries
  getMinistries(): Promise<Ministry[]>;
  getMinistry(id: number): Promise<Ministry | undefined>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;

  // Locations
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Equipment
  getEquipments(): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;

  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Schedules
  getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  createAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Ministries
  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries);
  }

  async getMinistry(id: number): Promise<Ministry | undefined> {
    const [ministry] = await db.select().from(ministries).where(eq(ministries.id, id));
    return ministry;
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const [ministry] = await db.insert(ministries).values(insertMinistry).returning();
    return ministry;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  // Equipment
  async getEquipments(): Promise<Equipment[]> {
    return await db.select().from(equipments);
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [equipment] = await db.insert(equipments).values(insertEquipment).returning();
    return equipment;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  // Schedules
  async getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]> {
    const result = await db.select().from(schedules).orderBy(desc(schedules.date));
    
    // Fetch assignments for these schedules
    // This is N+1 but simple for now, can optimize with join later
    const schedulesWithAssignments = await Promise.all(result.map(async (schedule) => {
      const assignments = await db.select().from(scheduleAssignments).where(eq(scheduleAssignments.scheduleId, schedule.id));
      return { ...schedule, assignments };
    }));

    return schedulesWithAssignments;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values(insertSchedule).returning();
    return schedule;
  }

  async createAssignment(insertAssignment: InsertScheduleAssignment): Promise<ScheduleAssignment> {
    const [assignment] = await db.insert(scheduleAssignments).values(insertAssignment).returning();
    return assignment;
  }
}

export const storage = new DatabaseStorage();
