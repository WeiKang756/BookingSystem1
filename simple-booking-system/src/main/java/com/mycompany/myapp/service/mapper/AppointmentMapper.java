package com.mycompany.myapp.service.mapper;

import com.mycompany.myapp.domain.Appointment;
import com.mycompany.myapp.domain.Service;
import com.mycompany.myapp.domain.User;
import com.mycompany.myapp.service.dto.AppointmentDTO;
import com.mycompany.myapp.service.dto.ServiceDTO;
import com.mycompany.myapp.service.dto.UserDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Appointment} and its DTO {@link AppointmentDTO}.
 */
@Mapper(componentModel = "spring")
public interface AppointmentMapper extends EntityMapper<AppointmentDTO, Appointment> {
    @Mapping(target = "user", source = "user", qualifiedByName = "userLogin")
    @Mapping(target = "service", source = "service", qualifiedByName = "serviceName")
    AppointmentDTO toDto(Appointment s);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);

    @Named("serviceName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    ServiceDTO toDtoServiceName(Service service);
}
