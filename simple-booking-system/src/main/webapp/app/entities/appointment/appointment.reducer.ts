import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';
import { cleanEntity } from 'app/shared/util/entity-utils';
import { EntityState, IQueryParams, createEntitySlice, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IAppointment, defaultValue } from 'app/shared/model/appointment.model';

const initialState: EntityState<IAppointment> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/appointments';

// Actions

export const getEntities = createAsyncThunk(
  'appointment/fetch_entity_list',
  async ({ page, size, sort }: IQueryParams) => {
    const requestUrl = `${apiUrl}?${sort ? `page=${page}&size=${size}&sort=${sort}&` : ''}cacheBuster=${new Date().getTime()}`;
    return axios.get<IAppointment[]>(requestUrl);
  },
  { serializeError: serializeAxiosError },
);

export const getEntity = createAsyncThunk(
  'appointment/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IAppointment>(requestUrl);
  },
  { serializeError: serializeAxiosError },
);

export const createEntity = createAsyncThunk(
  'appointment/create_entity',
  async (entity: IAppointment, thunkAPI) => {
    const result = await axios.post<IAppointment>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError },
);

export const updateEntity = createAsyncThunk(
  'appointment/update_entity',
  async (entity: IAppointment, thunkAPI) => {
    const result = await axios.put<IAppointment>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError },
);

export const partialUpdateEntity = createAsyncThunk(
  'appointment/partial_update_entity',
  async (entity: IAppointment, thunkAPI) => {
    const result = await axios.patch<IAppointment>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError },
);

export const approveAppointment = createAsyncThunk(
  'appointment/approve',
  async (id: string | number, thunkAPI) => {
    try {
      // First try the PUT endpoint
      const requestUrl = `${apiUrl}/${id}/approve`;
      try {
        // Use axios as it has auth interceptors configured
        const result = await axios.put<IAppointment>(requestUrl, {});
        thunkAPI.dispatch(getEntities({}));
        return result;
      } catch (putError) {
        console.warn('PUT approval failed, trying GET fallback', putError);
        // Fallback to GET endpoint
        const fallbackUrl = `${apiUrl}/${id}/approve-test`;
        const fallbackResult = await axios.get<IAppointment>(fallbackUrl);
        thunkAPI.dispatch(getEntities({}));
        return fallbackResult;
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      return thunkAPI.rejectWithValue(error);
    }
  },
  { serializeError: serializeAxiosError },
);

export const rejectAppointment = createAsyncThunk(
  'appointment/reject',
  async (id: string | number, thunkAPI) => {
    try {
      // First try the PUT endpoint
      const requestUrl = `${apiUrl}/${id}/reject`;
      try {
        const result = await axios.put<IAppointment>(requestUrl, {});
        thunkAPI.dispatch(getEntities({}));
        return result;
      } catch (putError) {
        console.warn('PUT rejection failed, trying GET fallback', putError);
        // Fallback to GET endpoint
        const fallbackUrl = `${apiUrl}/${id}/reject-test`;
        const fallbackResult = await axios.get<IAppointment>(fallbackUrl);
        thunkAPI.dispatch(getEntities({}));
        return fallbackResult;
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      return thunkAPI.rejectWithValue(error);
    }
  },
  { serializeError: serializeAxiosError },
);

export const cancelAppointment = createAsyncThunk(
  'appointment/cancel',
  async (id: string | number, thunkAPI) => {
    try {
      const requestUrl = `${apiUrl}/${id}/cancel`;
      const result = await axios.put<IAppointment>(requestUrl, {});
      thunkAPI.dispatch(getEntities({}));
      return result;
    } catch (error) {
      console.error('Error canceling appointment:', error);
      return thunkAPI.rejectWithValue(error);
    }
  },
  { serializeError: serializeAxiosError },
);

export const completeAppointment = createAsyncThunk(
  'appointment/complete',
  async (id: string | number, thunkAPI) => {
    try {
      // First try the PUT endpoint
      const requestUrl = `${apiUrl}/${id}/complete`;
      try {
        const result = await axios.put<IAppointment>(requestUrl, {});
        thunkAPI.dispatch(getEntities({}));
        return result;
      } catch (putError) {
        console.warn('PUT completion failed, trying GET fallback', putError);
        // Fallback to GET endpoint
        const fallbackUrl = `${apiUrl}/${id}/complete-test`;
        const fallbackResult = await axios.get<IAppointment>(fallbackUrl);
        thunkAPI.dispatch(getEntities({}));
        return fallbackResult;
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      return thunkAPI.rejectWithValue(error);
    }
  },
  { serializeError: serializeAxiosError },
);

export const deleteEntity = createAsyncThunk(
  'appointment/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IAppointment>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError },
);

// slice

export const AppointmentSlice = createEntitySlice({
  name: 'appointment',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addCase(approveAppointment.fulfilled, (state, action) => {
        state.updating = false;
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(rejectAppointment.fulfilled, (state, action) => {
        state.updating = false;
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.updating = false;
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.updating = false;
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(
        isPending(
          createEntity,
          updateEntity,
          partialUpdateEntity,
          deleteEntity,
          approveAppointment,
          rejectAppointment,
          cancelAppointment,
          completeAppointment,
        ),
        state => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.updating = true;
        },
      );
  },
});

export const { reset } = AppointmentSlice.actions;

// Reducer
export default AppointmentSlice.reducer;
