import React from 'react';
import { Translate } from 'react-jhipster';
import { NavDropdown } from './menu-components';
import MenuItem from './menu-item';
import { NavLink } from 'reactstrap';
import { NavLink as Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export const BookingMenu = ({ isAuthenticated = false }) =>
  isAuthenticated ? (
    <NavLink tag={Link} to="/booking" className="d-flex align-items-center">
      <FontAwesomeIcon icon={faCalendarAlt} />
      <span className="ms-1">Book Now</span>
    </NavLink>
  ) : null;
