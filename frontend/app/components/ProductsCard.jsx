import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {addItem} from '../store/slices/cartSlice';

const ProductsCard = (props) => {
    const {img, rating, title, price} = props;
    const [isAdded, setIsAdded] = useState(false);

    const dispatch = useDispatch();
}