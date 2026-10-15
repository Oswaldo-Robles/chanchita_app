export type Perfil = {
  nombre: string;
  telefonoYape: string;
};

export type Participante = {
  id: string;
  nombre: string;
  telefono?: string; // 9 dígitos, ej. 987654321
  esOrganizador?: boolean; // el dueño de la app; no se puede quitar de la salida
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

/** Lo que el usuario lleva escrito al crear una salida y todavía no guardó. */
export type BorradorSalida = {
  nombre: string;
  fecha: string;
  participantes: Participante[];
};
