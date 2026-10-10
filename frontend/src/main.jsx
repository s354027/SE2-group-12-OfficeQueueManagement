import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Totem from './components/Totem.jsx';
import CounterUI from './components/CounterUI.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<Totem />} />
			<Route path="/counter-ui/:counterId" element={<CounterUI />} />
		</Routes>
	</BrowserRouter>,
);