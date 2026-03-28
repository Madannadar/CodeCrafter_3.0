const fs = require('fs');
const path = require('path');

const datasetDir = 'dataset';
const outputDir = 'web-frontend/src/data/datasets';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(datasetDir);

files.forEach(file => {
    const filePath = path.join(datasetDir, file);
    let data;

    if (file.endsWith('.json')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content || content.trim() === '') return;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.error(`Error parsing JSON from ${file}:`, e);
            return;
        }
    } else if (file.endsWith('.js')) {
        // Handle files like dbms.js, os.js, mp.js which have commented out JSON
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const jsonContent = lines.map(line => line.trim().startsWith('//') ? line.trim().substring(2).trim() : line).join('\n');
        try {
            data = JSON.parse(jsonContent);
        } catch (e) {
            // Some might not be JSON, skip
            return;
        }
    } else {
        return;
    }

    if (data && data.questions) {
        data.questions = data.questions.map(q => {
            // Normalize Type
            let type = (q.type || 'mcq').toLowerCase().replace(' ', '');
            if (type === 'mcq') type = 'mcq';
            else if (type.includes('short')) type = 'short';
            else if (type.includes('concept')) type = 'conceptual';
            else if (type.includes('numeric')) type = 'numerical';
            else if (type.includes('theory')) type = 'conceptual';
            else if (type.includes('diagram')) type = 'conceptual';
            else if (type.includes('true') || type.includes('false')) {
                type = 'mcq';
                if (!q.options) q.options = ['True', 'False'];
            }
            
            // Normalize Difficulty
            let difficulty = (q.difficulty || 'medium').toLowerCase();

            // Ensure options is an array if it's MCQ
            if (type === 'mcq' && !q.options) {
                q.options = ['Option A', 'Option B', 'Option C', 'Option D']; // Placeholder
            }

            return {
                ...q,
                type,
                difficulty
            };
        });

        const outputFileName = file.endsWith('.js') ? file.replace('.js', '.json') : file;
        fs.writeFileSync(path.join(outputDir, outputFileName), JSON.stringify(data, null, 2));
        console.log(`Processed and saved: ${outputFileName}`);
    }
});
