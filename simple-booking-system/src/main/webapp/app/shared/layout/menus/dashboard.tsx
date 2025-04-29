import React from 'react';
import { Translate } from 'react-jhipster';
import { NavDropdown } from './menu-components';
import MenuItem from './menu-item';
import { NavLink } from 'reactstrap';
import { NavLink as Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt } from '@fortawesome/free-solid-svg-icons';

export const DashboardMenu = ({ isAuthenticated = false }) =>
  isAuthenticated ? (
    <NavLink tag={Link} to="/dashboard" className="d-flex align-items-center">
      <FontAwesomeIcon icon={faTachometerAlt} />
      <span className="ms-1">Dashboard</span>
    </NavLink>
  ) : null;
