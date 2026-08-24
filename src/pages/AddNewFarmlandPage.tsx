import React from 'react';
import AddNewFarmlandWizard from '../components/farmland/AddNewFarmlandWizard';

export const AddNewFarmlandPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <AddNewFarmlandWizard isModal={false} />
    </div>
  );
};

export default AddNewFarmlandPage;
