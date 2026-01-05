import {
  type User,
  type InsertUser,
  type Ministry,
  type InsertMinistry,
  type Location,
  type InsertLocation,
  type Equipment,
  type InsertEquipment,
  type Service,
  type InsertService,
  type Event,
  type InsertEvent,
  type Schedule,
  type InsertSchedule,
  type ScheduleAssignment,
  type InsertScheduleAssignment,
  users,
  ministries,
  locations,
  equipments,
  services,
  events,
  schedules,
  scheduleAssignments,
} from "@shared/schema";

import { db } from "./db";
import { eq, desc } from "drizzle-orm";

/**
 * Interface de abstração do Storage
 * (base sólida para futuras implementações)
 */
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Admin / Users
  getUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User>;

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
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Schedules
  getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;

  //Assignments
  createAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment>;
  deleteAssignment(id: number): Promise<void>;
  deleteAssignment(id: number): Promise<void>;
}

/**
 * Implementação com banco de dados (Drizzle + Postgres)
 */
export class DatabaseStorage implements IStorage {
  /* ===========================
     USERS
     =========================== */

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
  

  /* ===========================
     ADMIN / USERS
     =========================== */

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async updateUserProfile(userId: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  /* ===========================
     MINISTRIES
     =========================== */

  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries);
  }

  async getMinistry(id: number): Promise<Ministry | undefined> {
    const [ministry] = await db
      .select()
      .from(ministries)
      .where(eq(ministries.id, id));

    return ministry;
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const [ministry] = await db
      .insert(ministries)
      .values(insertMinistry)
      .returning();

    return ministry;
  }

  /* ===========================
     LOCATIONS
     =========================== */

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();

    return location;
  }

  /* ===========================
     EQUIPMENTS
     =========================== */

  async getEquipments(): Promise<Equipment[]> {
    return await db.select().from(equipments);
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [equipment] = await db
      .insert(equipments)
      .values(insertEquipment)
      .returning();

    return equipment;
  }

  /* ===========================
     SERVICES
     =========================== */

  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();

    return service;
  }

  /* ===========================
     EVENTS
     =========================== */

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();

    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));

    return event;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      })
      .where(eq(events.id, id))
      .returning();

    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  /* ===========================
     SCHEDULES
     =========================== */

  async getSchedules(): Promise<
    (Schedule & { assignments: ScheduleAssignment[] })[]
  > {
    const schedulesList = await db
      .select()
      .from(schedules)
      .orderBy(desc(schedules.date));

    const schedulesWithAssignments = await Promise.all(
      schedulesList.map(async (schedule) => {
        const assignments = await db
          .select()
          .from(scheduleAssignments)
          .where(eq(scheduleAssignments.scheduleId, schedule.id));

        return { ...schedule, assignments };
      })
    );

    return schedulesWithAssignments;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();

    return schedule;
  }

  async createAssignment(
    insertAssignment: InsertScheduleAssignment
  ): Promise<ScheduleAssignment> {
    const [assignment] = await db
      .insert(scheduleAssignments)
      .values(insertAssignment)
      .returning();

    return assignment;
  }
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id));

    return schedule;
  }

  async updateSchedule(
    id: number,
    data: Partial<InsertSchedule>
  ): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      })
      .where(eq(schedules.id, id))
      .returning();

    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db
      .delete(scheduleAssignments)
      .where(eq(scheduleAssignments.scheduleId, id));

    await db.delete(schedules).where(eq(schedules.id, id));
  }

  /* ===========================
     ASSIGNMENTS
     =========================== */

  async deleteAssignment(id: number): Promise<void> {
    await db.delete(scheduleAssignments).where(eq(scheduleAssignments.id, id));
  }
}

export const storage = new DatabaseStorage();
