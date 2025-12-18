export interface IPrinter {
  id: number;
  registered: string;
  name: string;
  power_watts?: number;
  depreciation_cost_per_hour?: number;
  comment?: string;
}
