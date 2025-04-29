package com.mycompany.myapp.service.mapper;

import com.mycompany.myapp.domain.Service;
import com.mycompany.myapp.service.dto.ServiceDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Service} and its DTO {@link ServiceDTO}.
 */
@Mapper(componentModel = "spring")
public interface ServiceMapper extends EntityMapper<ServiceDTO, Service> {}
