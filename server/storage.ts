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

/**
 * Interface de abstração do Storage
 */
export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User>;

  // Ministries
  getMinistries(): Promise<Ministry[]>;
  getMinistriesWithCount(): Promise<any[]>;
  getMinistry(id: number): Promise<Ministry | undefined>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;
  updateMinistry(id: number, data: any): Promise<Ministry>;
  deleteMinistry(id: number): Promise<void>;

  // Ministry Members & Functions
  getMinistryMembers(ministryId: number): Promise<User[]>;
  addMinistryMember(ministryId: number, userId: number): Promise<void>;
  removeMinistryMember(ministryId: number, userId: number): Promise<void>;
  getMinistryFunctions(ministryId: number): Promise<MinistryFunction[]>;
  createMinistryFunction(
    ministryId: number,
    name: string
  ): Promise<MinistryFunction>;
  deleteMinistryFunction(id: number): Promise<void>;

  // Ministry Requests
  getPendingMinistryRequestsCount(): Promise<number>;
  getPendingMinistryRequests(): Promise<any[]>;
  updateMinistryRequestStatus(
    id: number,
    status: string,
    adminId: number
  ): Promise<any>;
  createMinistryRequest(insertRequest: any): Promise<any>;

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

  // Schedules & Assignments
  getSchedules(): Promise<(Schedule & { assignments: ScheduleAssignment[] })[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  createAssignment(
    assignment: InsertScheduleAssignment
  ): Promise<ScheduleAssignment>;
  deleteAssignment(id: number): Promise<void>;

  // Infrastructure (Locations & Equipment)
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  getEquipments(): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(
    id: number,
    data: Partial<InsertEquipment>
  ): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;
}

/**
 * Implementação DatabaseStorage (Drizzle + Postgres)
 */
export class DatabaseStorage implements IStorage {
  /* ===========================
      USUÁRIOS & AUTENTICAÇÃO
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
    return await db.select().from(users);
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
      MINISTÉRIOS
     =========================== */

  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries);
  }

  async getMinistriesWithCount() {
    const allMinistries = await db.select().from(ministries);
    return await Promise.all(
      allMinistries.map(async (m) => {
        const [res] = await db
          .select({ val: count() })
          .from(ministryMembers)
          .where(eq(ministryMembers.ministryId, m.id));
        return { ...m, memberCount: res.val };
      })
    );
  }

  async getMinistry(id: number): Promise<Ministry | undefined> {
    const [ministry] = await db
      .select()
      .from(ministries)
      .where(eq(ministries.id, id));
    return ministry;
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const data = {
      ...insertMinistry,
      leaderId: insertMinistry.leaderId
        ? Number(insertMinistry.leaderId)
        : null,
    };
    const [ministry] = await db.insert(ministries).values(data).returning();
    return ministry;
  }

  async updateMinistry(id: number, data: any): Promise<any> {
    const updateData = {
      name: data.name,
      description: data.description,
      leaderId:
        data.leaderId && data.leaderId !== "" ? Number(data.leaderId) : null,
    };
    const [updated] = await db
      .update(ministries)
      .set(updateData)
      .where(eq(ministries.id, id))
      .returning();
    if (!updated) throw new Error("Ministério não encontrado");
    return updated;
  }

  async deleteMinistry(id: number): Promise<void> {
    await db.delete(ministryMembers).where(eq(ministryMembers.ministryId, id));
    await db
      .delete(ministryFunctions)
      .where(eq(ministryFunctions.ministryId, id));
    await db.delete(ministries).where(eq(ministries.id, id));
  }

  /* ===========================
      MEMBROS & ESPECIALIDADES
     =========================== */

  async getMinistryMembers(ministryId: number): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        phone: users.phone,
        theme: users.theme,
        active: users.active,
        password: users.password,
      })
      .from(ministryMembers)
      .innerJoin(users, eq(ministryMembers.userId, users.id))
      .where(eq(ministryMembers.ministryId, ministryId));
  }

  async addMinistryMember(ministryId: number, userId: number): Promise<void> {
    await db.insert(ministryMembers).values({ ministryId, userId });
  }

  async removeMinistryMember(
    ministryId: number,
    userId: number
  ): Promise<void> {
    await db
      .delete(ministryMembers)
      .where(
        and(
          eq(ministryMembers.ministryId, ministryId),
          eq(ministryMembers.userId, userId)
        )
      );
  }

  async getMinistryFunctions(ministryId: number): Promise<MinistryFunction[]> {
    return await db
      .select()
      .from(ministryFunctions)
      .where(eq(ministryFunctions.ministryId, ministryId));
  }

  async createMinistryFunction(
    ministryId: number,
    name: string
  ): Promise<MinistryFunction> {
    const [newFn] = await db
      .insert(ministryFunctions)
      .values({ ministryId, name })
      .returning();
    return newFn;
  }

  async deleteMinistryFunction(id: number): Promise<void> {
    await db.delete(ministryFunctions).where(eq(ministryFunctions.id, id));
  }

  /* ===========================
      SOLICITAÇÕES
     =========================== */

  async getPendingMinistryRequestsCount(): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(userMinistries)
      .where(eq(userMinistries.status, "PENDING"));
    return result.value;
  }

  async getPendingMinistryRequests(): Promise<any[]> {
    return await db
      .select({
        id: userMinistries.id,
        roles: userMinistries.roles,
        createdAt: userMinistries.createdAt,
        user: { name: users.name },
        ministry: { name: ministries.name },
      })
      .from(userMinistries)
      .innerJoin(users, eq(userMinistries.userId, users.id))
      .innerJoin(ministries, eq(userMinistries.ministryId, ministries.id))
      .where(eq(userMinistries.status, "PENDING"));
  }

  async updateMinistryRequestStatus(
    id: number,
    status: string,
    adminId: number
  ): Promise<any> {
    const [updated] = await db
      .update(userMinistries)
      .set({ status })
      .where(eq(userMinistries.id, id))
      .returning();
    await db.insert(auditLogs).values({
      action:
        status === "APPROVED" ? "MINISTRY_APPROVAL" : "MINISTRY_REJECTION",
      details: `Status alterado para ${status} pelo admin ID ${adminId}`,
      adminId,
    });
    return updated;
  }

  async createMinistryRequest(insertRequest: any): Promise<any> {
    const [req] = await db
      .insert(userMinistries)
      .values(insertRequest)
      .returning();
    return req;
  }

  /* ===========================
      EVENTOS & ESCALAS
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

  async updateEvent(
    id: number,
    updateData: Partial<InsertEvent>
  ): Promise<Event> {
    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getSchedules(): Promise<
    (Schedule & { assignments: ScheduleAssignment[] })[]
  > {
    const list = await db
      .select()
      .from(schedules)
      .orderBy(desc(schedules.date));
    return await Promise.all(
      list.map(async (s) => {
        const assignments = await db
          .select()
          .from(scheduleAssignments)
          .where(eq(scheduleAssignments.scheduleId, s.id));
        return { ...s, assignments };
      })
    );
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [s] = await db.insert(schedules).values(insertSchedule).returning();
    return s;
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [s] = await db.select().from(schedules).where(eq(schedules.id, id));
    return s;
  }

  async updateSchedule(
    id: number,
    data: Partial<InsertSchedule>
  ): Promise<Schedule> {
    const [s] = await db
      .update(schedules)
      .set({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      })
      .where(eq(schedules.id, id))
      .returning();
    return s;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db
      .delete(scheduleAssignments)
      .where(eq(scheduleAssignments.scheduleId, id));
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async createAssignment(
    insertAssignment: InsertScheduleAssignment
  ): Promise<ScheduleAssignment> {
    const [a] = await db
      .insert(scheduleAssignments)
      .values(insertAssignment)
      .returning();
    return a;
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.delete(scheduleAssignments).where(eq(scheduleAssignments.id, id));
  }

  /* ===========================
      INFRAESTRUTURA & SERVIÇOS
     =========================== */

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(asc(locations.name));
  }

  async createLocation(insert: InsertLocation): Promise<Location> {
    const [l] = await db.insert(locations).values(insert).returning();
    return l;
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(asc(services.dayOfWeek));
  }

  async createService(insert: InsertService): Promise<Service> {
    const [s] = await db
      .insert(services)
      .values({
        ...insert,
        dayOfWeek: Number(insert.dayOfWeek),
        intervalWeeks: insert.intervalWeeks ? Number(insert.intervalWeeks) : 1,
        monthlyWeeks: insert.monthlyWeeks || null,
        // Garante que o banco receba um objeto Date
        startDate: new Date(insert.startDate),
      })
      .returning();
    return s;
  }

  async updateService(
    id: number,
    data: Partial<InsertService>
  ): Promise<Service> {
    const [s] = await db
      .update(services)
      .set({
        ...data,
        dayOfWeek:
          data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : undefined,
        intervalWeeks:
          data.intervalWeeks !== undefined
            ? Number(data.intervalWeeks)
            : undefined,
        monthlyWeeks: data.monthlyWeeks ?? null,
      })
      .where(eq(services.id, id))
      .returning();
    if (!s) throw new Error("Culto não encontrado");
    return s;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getEquipments(): Promise<Equipment[]> {
    return await db.select().from(equipments).orderBy(asc(equipments.name));
  }

  async createEquipment(insert: InsertEquipment): Promise<Equipment> {
    // Sanitização preventiva para criação
    const data = {
      ...insert,
      locationId: insert.locationId ? Number(insert.locationId) : null,
    };
    const [e] = await db.insert(equipments).values(data).returning();
    return e;
  }

  async updateEquipment(
    id: number,
    data: Partial<InsertEquipment>
  ): Promise<Equipment> {
    // Melhor Prática: Limpeza de dados antes do UPDATE
    const [updated] = await db
      .update(equipments)
      .set(data)
      .where(eq(equipments.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Equipamento com ID ${id} não encontrado.`);
    }

    return updated;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipments).where(eq(equipments.id, id));
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!user) throw new Error("Usuário não encontrado");
    return user;
  }
}

export const storage = new DatabaseStorage();
