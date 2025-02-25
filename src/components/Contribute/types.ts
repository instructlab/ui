export interface ActionGroupAlertContent {
  title: string;
  message: string;
  waitAlert?: boolean;
  url?: string;
  success: boolean;
  timeout?: number | boolean;
}
