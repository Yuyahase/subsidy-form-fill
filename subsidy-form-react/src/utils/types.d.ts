export interface FormData {
  entityType: "法人" | "個人事業主";
  companyName: string;
  companyNameKana: string;
  representativeLastName: string;
  representativeFirstName: string;
  representativeLastNameKana: string;
  representativeFirstNameKana: string;
  address1PostalCode: string;
  address1Prefecture: string;
  address1City: string;
  address1Street: string;
  address2PostalCode?: string;
  address2Prefecture?: string;
  address2City?: string;
  address2Street?: string;
  workerCount: number;
  applicationMethod: "紙申請" | "電子申請";
  contactLastName: string;
  contactFirstName: string;
  contactLastNameKana: string;
  contactFirstNameKana: string;
  contactPhone: string;
  contactEmail: string;
  agentName?: string;
  applicationReason: string;
}