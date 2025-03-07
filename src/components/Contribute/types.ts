export interface ActionGroupAlertContent {
  title: string;
  message: string;
  waitAlert?: boolean;
  url?: string;
  urlText?: string;
  isUrlExternal?: boolean;
  success: boolean;
  timeout?: number | boolean;
}
