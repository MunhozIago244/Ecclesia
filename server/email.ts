import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * SERVIÇO DE NOTIFICAÇÕES POR EMAIL
 * Gerencia envio de emails para usuários do sistema Ecclesia
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const requiredVars = [
      process.env.SMTP_HOST,
      process.env.SMTP_PORT,
      process.env.SMTP_USER,
      process.env.SMTP_PASS,
    ];

    // Se todas as variáveis SMTP estiverem configuradas, habilita o serviço
    if (requiredVars.every((v) => v)) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.enabled = true;
        console.log("✅ [Email] Serviço de notificações ativado");
      } catch (error) {
        console.warn("⚠️ [Email] Erro ao configurar transporte:", error);
        this.enabled = false;
      }
    } else {
      console.log(
        "ℹ️ [Email] Serviço desabilitado (variáveis SMTP não configuradas)",
      );
    }
  }

  /**
   * Envia um email genérico
   */
  async send(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log(
        `📧 [Email] Modo simulado - Email para ${options.to}: ${options.subject}`,
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "Ecclesia"}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""), // Remove HTML tags para versão texto
      });
      console.log(`✅ [Email] Enviado para ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error(`❌ [Email] Erro ao enviar para ${options.to}:`, error);
      return false;
    }
  }

  /**
   * TEMPLATE: Solicitação de ministério aprovada
   */
  async sendMinistryApproval(
    userEmail: string,
    userName: string,
    ministryName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Solicitação Aprovada! 🎉",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Sua solicitação para participar do ministério <strong>${ministryName}</strong> foi aprovada pela liderança.</p>
        <p>Agora você faz parte da equipe e poderá ser escalado para servir nos próximos cultos e eventos.</p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.APP_URL || "http://localhost:5173"}/ministries" 
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Ver Meus Ministérios
          </a>
        </p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: `✅ Bem-vindo ao ministério ${ministryName}!`,
      html,
    });
  }

  /**
   * TEMPLATE: Solicitação de ministério rejeitada
   */
  async sendMinistryRejection(
    userEmail: string,
    userName: string,
    ministryName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Sobre sua Solicitação",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Sua solicitação para participar do ministério <strong>${ministryName}</strong> não foi aprovada no momento.</p>
        <p>Isso pode acontecer por diversos motivos, como:</p>
        <ul style="line-height: 1.8;">
          <li>Ministério já com equipe completa</li>
          <li>Necessidade de treinamento prévio</li>
          <li>Análise ainda em andamento</li>
        </ul>
        <p>Entre em contato com a liderança para mais informações. Há muitas outras formas de servir! 💙</p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: `Sobre sua solicitação - ${ministryName}`,
      html,
    });
  }

  /**
   * TEMPLATE: Nova escala atribuída
   */
  async sendScheduleAssignment(
    userEmail: string,
    userName: string,
    scheduleName: string,
    scheduleDate: string,
    functionName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Nova Escala Atribuída 📅",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Você foi escalado para servir:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Evento:</strong> ${scheduleName}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${scheduleDate}</p>
          <p style="margin: 5px 0;"><strong>Função:</strong> ${functionName}</p>
        </div>
        <p>Por favor, confirme sua presença o quanto antes.</p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.APP_URL || "http://localhost:5173"}/schedules" 
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Ver Minhas Escalas
          </a>
        </p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: `📅 Nova escala: ${scheduleName}`,
      html,
    });
  }

  /**
   * TEMPLATE: Lembrete de escala (1 dia antes)
   */
  async sendScheduleReminder(
    userEmail: string,
    userName: string,
    scheduleName: string,
    scheduleDate: string,
    functionName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Lembrete de Escala 🔔",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Este é um lembrete amigável sobre sua escala de amanhã:</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Evento:</strong> ${scheduleName}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${scheduleDate}</p>
          <p style="margin: 5px 0;"><strong>Sua função:</strong> ${functionName}</p>
        </div>
        <p>Contamos com você! 💪</p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: `🔔 Lembrete: ${scheduleName} amanhã`,
      html,
    });
  }

  /**
   * TEMPLATE: Conta ativada
   */
  async sendAccountActivation(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Conta Ativada! 🎉",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Sua conta no sistema Ecclesia foi ativada com sucesso.</p>
        <p>Agora você tem acesso completo à plataforma e pode participar de ministérios e escalas.</p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.APP_URL || "http://localhost:5173"}/login" 
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Plataforma
          </a>
        </p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: "✅ Sua conta foi ativada!",
      html,
    });
  }

  /**
   * TEMPLATE: Conta desativada
   */
  async sendAccountDeactivation(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Conta Desativada",
      `
        <p>Olá, <strong>${userName}</strong>.</p>
        <p>Sua conta no sistema Ecclesia foi temporariamente desativada.</p>
        <p>Se você acredita que isso é um erro ou deseja mais informações, entre em contato com a administração.</p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: "Sua conta foi desativada",
      html,
    });
  }

  /**
   * TEMPLATE: Bem-vindo (novo registro)
   */
  async sendWelcome(userEmail: string, userName: string): Promise<boolean> {
    const html = this.getEmailTemplate(
      "Bem-vindo ao Ecclesia! 👋",
      `
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Sua conta foi criada com sucesso. Bem-vindo à plataforma de gestão ministerial!</p>
        <p>Com o Ecclesia você pode:</p>
        <ul style="line-height: 1.8;">
          <li>Participar de ministérios</li>
          <li>Visualizar suas escalas</li>
          <li>Gerenciar sua disponibilidade</li>
          <li>Acompanhar eventos da igreja</li>
        </ul>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.APP_URL || "http://localhost:5173"}" 
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Começar Agora
          </a>
        </p>
      `,
    );

    return this.send({
      to: userEmail,
      subject: "🎉 Bem-vindo ao Ecclesia!",
      html,
    });
  }

  /**
   * Template base HTML para emails
   */
  private getEmailTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- HEADER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
                      ⛪ Ecclesia
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Sistema de Gestão Ministerial
                    </p>
                  </td>
                </tr>
                
                <!-- CONTEÚDO -->
                <tr>
                  <td style="padding: 40px 40px; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${content}
                  </td>
                </tr>
                
                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #f3f4f6; padding: 30px 40px; text-align: center; color: #6b7280; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">
                      Este é um email automático do sistema Ecclesia.
                    </p>
                    <p style="margin: 0;">
                      © ${new Date().getFullYear()} Ecclesia. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Verifica se o serviço está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Exporta uma instância única (Singleton)
export const emailService = new EmailService();
