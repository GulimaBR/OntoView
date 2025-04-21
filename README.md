# Ontology Visualizer

Ontology Visualizer is a web-based tool for visualizing and exploring ontologies in OWL, RDF, or XML formats. It provides an interactive graph view of ontology classes and relationships, supporting multiple languages and layout options.

## Features
- Upload and visualize your own ontology files (.owl, .rdf, .xml)
- Load a sample ontology for quick demonstration
- Switch between vertical and horizontal graph layouts
- Click on classes to view detailed information

## Getting Started

### Running Locally
1. Clone or download this repository.
2. Open `index.html` in your web browser.

No server setup is required; all processing is done client-side.

## File Structure
- `index.html` – Main HTML file and UI structure
- `main.js` – JavaScript logic for parsing and visualizing ontologies
- `styles.css` – Styles for the application
- `ontology/domain_ontology.owl` – Sample ontology file

## Usage
- Click "Load Sample Ontology" to view the example ontology.
- Or, use the file input to upload your own ontology file.
- Use the layout and language selectors to customize the visualization.
- Click on any class node to see its details in the info panel.

## Technologies Used
- [D3.js](https://d3js.org/) for graph visualization
- Vanilla JavaScript, HTML, and CSS

## License
This project is licensed under the MIT License.