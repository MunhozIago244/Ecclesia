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
  type MinistryFunction,
  users,
  ministries,
  locations,
  equipments,
  services,
  events,
  schedules,
  scheduleAssignments,
  ministryMembers,
  auditLogs,
  userMinistries,
  ministryFunctions,
} from "@shared/schema";

import { db } from "./db";
import { eq, desc, and, count, asc } from "drizzle-orm";

export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Ministries
  getMinistries(): Promise<Ministry[]>;
  getMinistriesWithCount(): Promise<any[]>;
  getMinistry(id: number): Promise<Ministry | undefined>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;
  updateMinistry(id: number, data: any): Promise<Ministry>;
  deleteMinistry(id: number): Promise<void>;

  // Ministry Members & Functions
  getMinistryMembers(ministryId: number): Promise<any[]>;
  addMinistryMember(ministryId: number, userId: number, functionId?: number | null): Promise<void>;
  removeMinistryMember(ministryId: number, userId: number): Promise<void>;
  getMinistryFunctions(ministryId: number): Promise<MinistryFunction[]>;
  createMinistryFunction(ministryId: number, name: string): Promise<MinistryFunction>;
  deleteMinistryFunction(id: number): Promise<void>;

  // Events & Services
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Schedules
  getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  /* ===========================
      USUÁRIOS
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!user) throw new Error("Usuário não encontrado");
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    // Limpar associações antes de deletar
    await db.delete(ministryMembers).where(eq(ministryMembers.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  /* ===========================
      MINISTÉRIOS & ESPECIALIDADES
     =========================== */

  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries).orderBy(asc(ministries.name));
  }

  async getMinistriesWithCount() {
    const allMinistries = await db.select().from(ministries).orderBy(asc(ministries.name));
    return await Promise.all(
      allMinistries.map(async (m) => {
        const [res] = await db.select({ val: count() }).from(ministryMembers).where(eq(ministryMembers.ministryId, m.id));
        return { ...m, memberCount: res.val };
      })
    );
  }

  async getMinistry(id: number): Promise<Ministry | undefined> {
    const [ministry] = await db.select().from(ministries).where(eq(ministries.id, id));
    return ministry;
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const data = {
      ...insertMinistry,
      leaderId: insertMinistry.leaderId ? Number(insertMinistry.leaderId) : null,
    };
    const [ministry] = await db.insert(ministries).values(data).returning();
    return ministry;
  }

  async updateMinistry(id: number, data: any): Promise<any> {
    const updateData = {
      name: data.name,
      description: data.description,
      leaderId: data.leaderId && data.leaderId !== "" ? Number(data.leaderId) : null,
    };
    const [updated] = await db.update(ministries).set(updateData).where(eq(ministries.id, id)).returning();
    return updated;
  }

  async deleteMinistry(id: number): Promise<void> {
    // Ordem de deleção para evitar erros de FK (Foreign Key)
    await db.delete(ministryMembers).where(eq(ministryMembers.ministryId, id));
    await db.delete(ministryFunctions).where(eq(ministryFunctions.ministryId, id));
    await db.delete(userMinistries).where(eq(userMinistries.ministryId, id));
    await db.delete(ministries).where(eq(ministries.id, id));
  }

  // MEMBROS
  async getMinistryMembers(ministryId: number): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        functionId: ministryMembers.functionId,
        functionName: ministryFunctions.name,
      })
      .from(ministryMembers)
      .innerJoin(users, eq(ministryMembers.userId, users.id))
      .leftJoin(ministryFunctions, eq(ministryMembers.functionId, ministryFunctions.id))
      .where(eq(ministryMembers.ministryId, ministryId));
  }

  async addMinistryMember(ministryId: number, userId: number, functionId?: number | null): Promise<void> {
    await db.insert(ministryMembers).values({ 
      ministryId: Number(ministryId), 
      userId: Number(userId), 
      functionId: functionId ? Number(functionId) : null 
    });
  }

  async removeMinistryMember(ministryId: number, userId: number): Promise<void> {
    await db.delete(ministryMembers).where(
      and(eq(ministryMembers.ministryId, ministryId), eq(ministryMembers.userId, userId))
    );
  }

  // ESPECIALIDADES (FUNCTIONS)
  async getMinistryFunctions(ministryId: number): Promise<MinistryFunction[]> {
    return await db.select().from(ministryFunctions).where(eq(ministryFunctions.ministryId, ministryId));
  }

  async createMinistryFunction(ministryId: number, name: string): Promise<MinistryFunction> {
    const [newFn] = await db.insert(ministryFunctions).values({ 
      ministryId: Number(ministryId), 
      name: name.trim() 
    }).returning();
    return newFn;
  }

  async deleteMinistryFunction(id: number): Promise<void> {
    await db.delete(ministryFunctions).where(eq(ministryFunctions.id, id));
  }

  /* ===========================
      EVENTOS, CULTOS E ESCALAS
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

  async updateEvent(id: number, updateData: Partial<InsertEvent>): Promise<Event> {
    const [updated] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(asc(services.dayOfWeek));
  }

  async createService(insert: InsertService): Promise<Service> {
    const [s] = await db.insert(services).values({
      ...insert,
      dayOfWeek: Number(insert.dayOfWeek),
      startDate: new Date(insert.startDate),
    }).returning();
    return s;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]> {
    const list = await db.select().from(schedules).orderBy(desc(schedules.date));
    return await Promise.all(
      list.map(async (s) => {
        const assignments = await db.select().from(scheduleAssignments).where(eq(scheduleAssignments.scheduleId, s.id));
        return { ...s, assignments };
      })
    );
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [s] = await db.insert(schedules).values(insertSchedule).returning();
    return s;
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule> {
    const [s] = await db.update(schedules).set(data).where(eq(schedules.id, id)).returning();
    return s;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(scheduleAssignments).where(eq(scheduleAssignments.scheduleId, id));
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  /* ===========================
      INFRAESTRUTURA
     =========================== */

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(asc(locations.name));
  }

  async createLocation(insert: InsertLocation): Promise<Location> {
    const [l] = await db.insert(locations).values(insert).returning();
    return l;
  }

  async getEquipments(): Promise<Equipment[]> {
    return await db.select().from(equipments).orderBy(asc(equipments.name));
  }

  async createEquipment(insert: InsertEquipment): Promise<Equipment> {
    const data = { ...insert, locationId: insert.locationId ? Number(insert.locationId) : null };
    const [e] = await db.insert(equipments).values(data).returning();
    return e;
  }

  async updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment> {
    const [updated] = await db.update(equipments).set(data).where(eq(equipments.id, id)).returning();
    return updated;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipments).where(eq(equipments.id, id));
  }

  // MÉTODOS ADICIONAIS DE INTERFACE (Placeholders para futuro)
  async getPendingMinistryRequestsCount(): Promise<number> { return 0; }
  async getPendingMinistryRequests(): Promise<any[]> { return []; }
  async updateMinistryRequestStatus(id: number, status: string, adminId: number): Promise<any> { return {}; }
  async createMinistryRequest(insertRequest: any): Promise<any> { return {}; }
  async updateService(id: number, data: Partial<InsertService>): Promise<Service> { return {} as Service; }
  async getSchedule(id: number): Promise<Schedule | undefined> { return undefined; }
  async createAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment> { return {} as ScheduleAssignment; }
  async deleteAssignment(id: number): Promise<void> {}
  async updateUserRole(userId: number, role: string): Promise<User> { return {} as User; }
  async updateUserProfile(userId: number, data: Partial<User>): Promise<User> { return {} as User; }
}

export const storage = new DatabaseStorage();