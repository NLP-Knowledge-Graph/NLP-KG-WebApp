import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { set } from 'zod';
import { parse } from 'path';

export type FilterData = {
    citation: number;
    startYear: number;
    endYear: number;
    venues: string[];
    fields: string[];
    survey: boolean | undefined;
}

interface VenueSelectProps {
    venues: string[] | undefined;
    fields: { [key: string]: string }[] | undefined;
    setFilterData: (data: FilterData) => void;
    showVenues?: boolean; 
}

function FilterBoard(props: VenueSelectProps) {    

    const [citation, setCitation] = useState(0);
    const [startYear, setStartYear] = useState(new Date(0));
    const [endYear, setEndYear] = useState(new Date(Date.now()));
    const [venues, setVenues] = useState<string[]>([]);
    const [fields, setFields] = useState<string[]>([]);
    const [survey, setSurvey] = useState<boolean>(false);
    const showVenues = props.showVenues ?? true; 

    const handleInputChangeCitation = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '') {
            setCitation(0);
            return;
        }
        const inputValue = e.target.value;
        if (/^\d*$/.test(inputValue)) {
            setCitation(parseInt(inputValue));
        }
    };

    const handleStartYearChange = (date: any) => {
        setStartYear(date);
    };

    const handleEndYearChange = (date: any) => {
        setEndYear(date);
    };

    const handleVenueChange = (venues: any) => {
        setVenues(venues.map((venue: any) => venue.value));
    }

    const handleFieldChange = (fields: any) => {
        setFields(fields.map((field: any) => field.value));
    }

    const handleSurveyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSurvey(e.target.checked);
    };

    const onSubmitFilters = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        props.setFilterData({"citation": citation, "startYear": startYear.getFullYear(), "endYear": endYear.getFullYear(), "venues": venues, "fields": fields, "survey": survey});
    }

    return (
        <div className="m-2 max-w-screen-md">
            <div className="mt-8 grid grid-cols-1 gap-6">
                <form onSubmit={onSubmitFilters}>
                <div className="flex flex-col mb-2">
                    <label className="text-stone-600 text-sm font-medium">Minimum citation</label>
                    <input 
                        type="text" 
                        id="citation" 
                        value={citation}
                        onChange={handleInputChangeCitation} 
                        className="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label className="text-stone-600 text-sm font-medium">Start year</label>
                    <DatePicker
                        selected={startYear}
                        onChange={handleStartYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                        customInput={
                            <input className="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                        }
                        placeholderText="YYYY"
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label className="text-stone-600 text-sm font-medium">End year</label>
                    <DatePicker
                        selected={endYear}
                        onChange={handleEndYearChange}
                        showYearPicker
                        dateFormat="yyyy"
                        customInput={
                            <input className="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                        }
                        placeholderText="YYYY"
                    />
                </div>
                {showVenues && (
                <div className="flex flex-col mb-2">
                    <label className="text-stone-600 text-sm font-medium">Venues</label>
                    <Select 
                        options={props.venues?.map(venue => ({ value: venue, label: venue })) ?? []}
                        isMulti
                        onChange={handleVenueChange}
                        className="mt-2"
                        classNamePrefix="select"
                        placeholder="Venue"
                    />
                </div>)}

                <div className="flex flex-col mb-2">
                    <label className="text-stone-600 text-sm font-medium">Field</label>
                    <Select 
                        options={props.fields?.map(field => ({ value: field.id, label: field.name })) ?? []}
                        isMulti
                        onChange={handleFieldChange}
                        className="mt-2"
                        classNamePrefix="select"
                        placeholder="Field"
                    />
                </div>

                <div className="flex flex-col mb-2">
                <label className="text-stone-600 text-sm font-medium">
                    <input 
                        type="checkbox" 
                        checked={survey}
                        onChange={handleSurveyChange}
                        className="mr-2"
                    />
                    Survey
                </label>
            </div>

                <div className="flex flex-col mb-2">
                    <button 
                    type="submit" 
                    className="active:scale-95 rounded-lg bg-primary focus:ring-blue-300 px-8 py-2 font-medium text-white outline-none focus:ring hover:opacity-90">Filter</button>
                </div>

                </form>


            </div>
            
        </div>
    )
}

export default FilterBoard