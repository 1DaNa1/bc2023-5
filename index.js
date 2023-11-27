const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 8000;

// Обробник статичних файлів
app.use(express.static(path.join(__dirname, 'static')));

app.use(express.json());

const notesFile = 'notes.json';

// Перевірка існування файлу з нотатками
const initializeNotesFile = async () => {
    try {
        await fs.access(notesFile);
    } catch (error) {
        await fs.writeFile(notesFile, '[]');
    }
};

initializeNotesFile();

// Отримання всіх нотаток
app.get('/notes', async (req, res) => {
    try {
        const notes = JSON.parse(await fs.readFile(notesFile));
        res.json(notes);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Отримання HTML форми для завантаження нотатки
app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/UploadForm.html'));
});

// Завантаження нотатки
app.post('/upload', async (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;

    try {
        const notes = JSON.parse(await fs.readFile(notesFile));

        // Перевірка наявності нотатки з таким ім'ям
        if (notes.some(note => note.name === noteName)) {
            res.status(400).send('Note with the same name already exists');
        } else {
            // Додавання нової нотатки
            notes.push({ name: noteName, text: noteText });
            await fs.writeFile(notesFile, JSON.stringify(notes));
            res.status(201).send('Note created successfully');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Отримання тексту нотатки за ім'ям
app.get('/notes/:noteName', async (req, res) => {
    const noteName = req.params.noteName;

    try {
        const notes = JSON.parse(await fs.readFile(notesFile));

        const note = notes.find(note => note.name === noteName);

        if (!note) {
            res.status(404).send('Note not found');
        } else {
            res.send(note.text);
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Оновлення тексту нотатки
app.put('/notes/:noteName', async (req, res) => {
    const noteName = req.params.noteName;
    const newText = req.body;

    try {
        const notes = JSON.parse(await fs.readFile(notesFile));

        const noteIndex = notes.findIndex(note => note.name === noteName);

        if (noteIndex === -1) {
            res.status(404).send('Note not found');
        } else {
            notes[noteIndex].text = newText;
            await fs.writeFile(notesFile, JSON.stringify(notes));
            res.send('Note updated successfully');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Видалення нотатки
app.delete('/notes/:noteName', async (req, res) => {
    const noteName = req.params.noteName;

    try {
        const notes = JSON.parse(await fs.readFile(notesFile));

        const filteredNotes = notes.filter(note => note.name !== noteName);

        if (filteredNotes.length === notes.length) {
            res.status(404).send('Note not found');
        } else {
            await fs.writeFile(notesFile, JSON.stringify(filteredNotes));
            res.send('Note deleted successfully');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
