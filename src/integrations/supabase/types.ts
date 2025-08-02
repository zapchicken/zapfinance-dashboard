export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bancos: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          nome: string
          saldo_atual: number | null
          saldo_inicial: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number | null
          saldo_inicial?: number | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number | null
          saldo_inicial?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias_despesas: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          categoria_id: string | null
          cliente_nome: string
          created_at: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          cliente_nome: string
          created_at?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          cliente_nome?: string
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          despesa_principal_id: string | null
          eh_parcelada: boolean | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          parcela_atual: number | null
          status: string
          total_parcelas: number | null
          updated_at: string
          user_id: string
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          despesa_principal_id?: string | null
          eh_parcelada?: boolean | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          status?: string
          total_parcelas?: number | null
          updated_at?: string
          user_id: string
          valor_parcela?: number
          valor_total: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          despesa_principal_id?: string | null
          eh_parcelada?: boolean | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          status?: string
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string
          valor_parcela?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_despesa_principal_id_fkey"
            columns: ["despesa_principal_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modalidades_receita: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_efetivacao: string
          id: string
          nome: string
          taxa_percentual: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_efetivacao: string
          id?: string
          nome: string
          taxa_percentual?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_efetivacao?: string
          id?: string
          nome?: string
          taxa_percentual?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          banco_id: string
          categoria_id: string | null
          created_at: string
          data_transacao: string
          descricao: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco_id: string
          categoria_id?: string | null
          created_at?: string
          data_transacao: string
          descricao: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco_id?: string
          categoria_id?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
