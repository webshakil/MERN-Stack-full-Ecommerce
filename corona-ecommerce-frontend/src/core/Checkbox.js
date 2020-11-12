import React, { useState, useEffect } from 'react';

const Checkbox = ({ categories, handleFilters }) => {
  const [checked, setCheked] = useState([]);

  const handleToggle = (c) => () => {
    // return the first index or -1
    //This will tell us if it is (ids) in the state(checked), if not return -1
    //This is not checkbox ratehr it is checked state. Donot think about checkbox only think about checked state to understand the code.
    const currentCategoryId = checked.indexOf(c);
    //This will give us all the category id in the state
    const newCheckedCategoryId = [...checked];
    // if currently checked was not already in checked state > push
    // else pull/take off
    if (currentCategoryId === -1) {
      newCheckedCategoryId.push(c);
    } else {
      newCheckedCategoryId.splice(currentCategoryId, 1);
    }
    // console.log(newCheckedCategoryId);
    setCheked(newCheckedCategoryId);
    handleFilters(newCheckedCategoryId);
  };

  return categories.map((c, i) => (
    <li key={i} className='list-unstyled'>
      <input
        onChange={handleToggle(c._id)}
        value={checked.indexOf(c._id === -1)} // for this value, we can see the unchecked checkbox
        type='checkbox'
        className='form-check-input'
      />
      <label className='form-check-label'>{c.name}</label>
    </li>
  ));
};

export default Checkbox;

//Note
//We are going to work in the checkbox here, so when user check one more categories we want to use method handle toggle so that we can get all the categories id and put them in an array then send to the backend so that we can get all the product based on that categories.

//so we are grabbing the array of categories id and we need to send this the parent component (shop component) and shop component will fetch all the product based on the filters.

//we are sending all categories id to shop component by handlefilters props.
