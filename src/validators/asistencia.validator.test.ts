import { describe, it, expect } from "vitest";
import { createAsistenciaSchema } from "./asistencia.validator";

describe("createAsistenciaSchema", () => {
  const validInput = {
    numeroDni: "12345678",
    apellidoPaterno: "GARCIA",
    nombres: "JUAN CARLOS",
    tipoDni: "azul" as const,
    eventoId: "evt-001",
  };

  it("accepts valid input with required fields only", () => {
    const result = createAsistenciaSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all optional fields", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      apellidoMaterno: "LOPEZ",
      etiqueta: "organizador",
      dia: 1,
      sesion: 3,
      tipo: "salida",
    });
    expect(result.success).toBe(true);
  });

  it("rejects DNI with less than 8 digits", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      numeroDni: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects DNI with more than 8 digits", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      numeroDni: "123456789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects DNI with non-numeric characters", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      numeroDni: "1234567A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tipoDni", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      tipoDni: "otro",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid etiqueta", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      etiqueta: "invitado",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tipo", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      tipo: "registro",
    });
    expect(result.success).toBe(false);
  });

  it("rejects session greater than 10", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      sesion: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects session less than 1", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      sesion: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty eventoId", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      eventoId: "",
    });
    expect(result.success).toBe(false);
  });

  it("trims apellidoPaterno", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      apellidoPaterno: "  GARCIA  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apellidoPaterno).toBe("GARCIA");
    }
  });

  it("accepts null apellidoMaterno", () => {
    const result = createAsistenciaSchema.safeParse({
      ...validInput,
      apellidoMaterno: null,
    });
    expect(result.success).toBe(true);
  });
});
