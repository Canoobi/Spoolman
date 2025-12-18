import { IFilament } from "../filaments/model";
import { IPrinter } from "../printers/model";

export interface ICostCalculation {
  id: number;
  created: string;
  printer?: IPrinter;
  filament?: IFilament;
  print_time_hours?: number;
  labor_time_hours?: number;
  filament_weight_g?: number;
  material_cost?: number;
  energy_cost?: number;
  depreciation_cost?: number;
  labor_cost?: number;
  consumables_cost?: number;
  failure_rate?: number;
  markup_rate?: number;
  base_price?: number;
  uplifted_price?: number;
  final_price?: number;
  currency?: string;
  notes?: string;
}
