type IncomeFormData = {
  id?: number;
  name: string;
  periodId: string;
  personId: string;
  date: string;
  amount: string;
  endDate:string;
};

type IncomeSchedule = {
  id: number;
  incomeId: number;
  date: string;
  amount: number;
  isReceived: boolean;
  income: {
    name: string;
  }[]; 
};
