export type Perfil = {
  nombre: string;
  telefonoYape: string;
};

export type Participante = {
  id: string;
  nombre: string;
  telefono?: string; // 9 dígitos, ej. 987654321
};

export type Gasto = {
  id: string;
  descripcion: string;
  montoCentimos: number;
  pagadoPor: string; // id de Participante
  divididoEntre: string[]; // ids de Participante; su orden define quién recibe el céntimo sobrante
};

export type Salida = {
  id: string;
  nombre: string;
  fecha: string; // ISO, ej. 2026-10-14
  participantes: Participante[];
  gastos: Gasto[];
};

// participanteId -> céntimos. Positivo: le deben. Negativo: debe.
export type Balances = Record<string, number>;

export type Transferencia = {
  de: string; // id del deudor
  a: string; // id del acreedor
  montoCentimos: number;
};
