import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { timetableAPI, subjectAPI } from '../utils/api';

function SampleTimetableGenerator({ branch, year, semester, onClose, onGenerationComplete }) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectFrequencies, setSubjectFrequencies] = useState([]);
  const [generateForAll, setGenerateForAll] = useState(true);
  
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!branch || !semester) return;
      setLoading(true);
      try {
        // Try primary query-based endpoint
        let response = await subjectAPI.getSubjects({ branch, semester });
        let data = response?.data?.data;
        if (!Array.isArray(data) || data.length === 0) {
          // Fallback to path-based endpoint
          try {
            response = await subjectAPI.getByBranchSemesterPath(branch, semester);
            data = response?.data?.data || response?.data;
          } catch (e) {
            // ignore; handled below
          }
        }
        if (!Array.isArray(data)) {
          toast.error('No subjects available for generation.');
          setSubjects([]);
          setSubjectFrequencies([]);
          return;
        }
        setSubjects(data);
        const initialFrequencies = data.map(subject => ({
          subjectId: subject.code || subject._id,
          name: subject.acronym || subject.name,
          weekly: subject.type === 'lab' ? 2 : 6,
          isLab: subject.type === 'lab',
          requires2Slots: subject.type === 'lab',
          canSplitBatch: subject.type === 'lab'
        }));
        setSubjectFrequencies(initialFrequencies);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        if (error.response) {
          if (error.response.status === 404) toast.error('No subjects endpoint found (404)');
          else if (error.response.status === 401) toast.error('Unauthorized (401)');
          else toast.error(`Failed to load subjects: ${error.response.status}`);
        } else if (error.request) {
          toast.error('Network error: Unable to connect to the server');
        } else {
          toast.error('Failed to load subjects');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [branch, semester]);

  const handleGenerateTimetable = async () => {
    if (subjectFrequencies.length === 0) {
      toast.error('No subjects available for generation');
      return;
    }
    
    try {
      setGenerating(true);
      
      const defaultSections = generateForAll ? [] : ['A']
      const perSectionSubjects = {}
      // Basic mapping: duplicate the frequencies for each selected section (no auto teacher assignment)
      const targetSections = defaultSections.length ? defaultSections : ['A']
      targetSections.forEach(sec => { perSectionSubjects[sec] = subjectFrequencies })

      const payload = {
        branch,
        year,
        semester,
        sections: defaultSections,
        weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        slotConfig: { startAt: "08:50", slotMinutes: 50, slotsPerDay: 8 },
        lunch: { dayIndex: 2, slotIndex: 3, label: 'Lunch' },
        perSectionSubjects,
        options: { avoidTeacherClashes: true, treatDraftsAsBusy: true, overwriteExisting: false, seed: 42 }
      };
      
      const response = await timetableAPI.generateSample(payload);
      
      if (response.data && response.data.status === "ok") {
        toast.success('Timetable generated successfully!');
        if (onGenerationComplete && response.data.generated) {
          // Get the first draft ID
          const firstSection = Object.values(response.data.generated)[0];
          if (firstSection && firstSection.draftId) {
            onGenerationComplete(firstSection.draftId);
          }
        }
      } else {
        toast.error('Failed to generate timetable');
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error(error.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Sample Timetable Generator</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-lg text-gray-700">Loading subjects...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Generate Sample Timetable</h3>
                <p className="text-sm text-gray-500">
                  This will generate a sample timetable for {branch} {semester} semester
                </p>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generateForAll}
                      onChange={() => setGenerateForAll(!generateForAll)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Generate for all sections</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateTimetable}
                  disabled={generating}
                  className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center"
                >
                  {generating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  {generating ? 'Generating...' : 'Generate Timetable'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SampleTimetableGenerator;