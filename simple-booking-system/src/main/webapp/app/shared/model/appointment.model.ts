import dayjs from 'dayjs';
import { IUser } from 'app/shared/model/user.model';
import { IService } from 'app/shared/model/service.model';
import { AppointmentStatus } from 'app/shared/model/enumerations/appointment-status.model';

export interface IAppointment {
  id?: number;
  startTime?: dayjs.Dayjs;
  endTime?: dayjs.Dayjs;
  status?: keyof typeof AppointmentStatus;
  user?: IUser;
  service?: IService | null;
}

export const defaultValue: Readonly<IAppointment> = {};
