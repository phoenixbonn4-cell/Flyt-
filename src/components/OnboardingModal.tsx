import React from 'react';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { Company } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (company: Company) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = (props) => {
  return <CompanyRegistrationModal {...props} />;
};
