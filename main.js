// Main JavaScript for Ontology Visualizer
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('ontology-file');
  const loadDefaultBtn = document.getElementById('load-default');
  const layoutSelector = document.getElementById('layout-direction');
  const languageSelector = document.getElementById('language-selector');
  
  // Current language preference
  window.currentLanguage = languageSelector.value || 'en';
  
  // Set up event listeners
  fileInput.addEventListener('change', handleFileUpload);
  loadDefaultBtn.addEventListener('click', loadDefaultOntology);
  layoutSelector.addEventListener('change', () => {
    // Reload visualization with new layout direction
    const xmlDoc = window.ontologyDoc;
    if (xmlDoc) {
      const ontologyData = extractOntologyData(xmlDoc);
      createVisualization(ontologyData);
    }
  });
  
  // Add language selector event listener
  languageSelector.addEventListener('change', () => {
    // Update current language
    window.currentLanguage = languageSelector.value;
    
    // Reload visualization with the new language
    const xmlDoc = window.ontologyDoc;
    if (xmlDoc) {
      const ontologyData = extractOntologyData(xmlDoc);
      createVisualization(ontologyData);
    }
  });
  
  // Load default ontology on page load
  loadDefaultOntology();
  
  // Add search functionality - with improved GitHub Pages compatibility
  initializeSearch();
  
  function initializeSearch() {
    try {
      const searchInput = document.getElementById('class-search');
      const searchButton = document.getElementById('search-button');
      
      if (!searchInput || !searchButton) {
        console.error('Search elements not found in DOM');
        return;
      }
      
      // Search button click event
      searchButton.addEventListener('click', performSearch);
      
      // Enter key in search input
      searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          performSearch();
        }
      });
      
      // Log successful initialization
      console.log('Search functionality initialized successfully');
    } catch (error) {
      console.error('Error initializing search:', error);
    }
  }
  
  // Function to perform the search
  function performSearch() {
    try {
      const searchInput = document.getElementById('class-search');
      if (!searchInput) {
        console.error('Search input not found');
        return;
      }
      
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        console.log('Empty search query');
        return;
      }
      
      // Check if visualization data is available
      if (!globalVisualizationState || !globalVisualizationState.treeData) {
        console.error('Visualization data not available');
        alert('No ontology loaded yet.');
        return;
      }
      
      const matches = findClassesByQuery(query);
      console.log(`Found ${matches.length} matches for query: "${query}"`);
      
      if (matches.length === 0) {
        alert(`No classes found matching "${query}"`);
      } else if (matches.length === 1) {
        // If only one match, focus on it directly
        lastSelectedClass = matches[0].id;
        showBranchOrFull(matches[0].id);
      } else {
        // Multiple matches, show dropdown
        showSearchResults(matches);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  }
  
  // Function to find classes matching a query
  function findClassesByQuery(query) {
    try {
      if (!globalVisualizationState || !globalVisualizationState.treeData) {
        console.error('Tree data not available for search');
        return [];
      }
      
      const allNodes = Array.from(globalVisualizationState.treeData.descendants());
      return allNodes.filter(node => {
        // Skip OntologyRoot
        if (!node.data || node.data.id === "OntologyRoot") return false;
        
        // Check if name or ID contains the search query
        const nameMatch = node.data.name && node.data.name.toLowerCase().includes(query);
        const idMatch = node.data.id && node.data.id.toLowerCase().includes(query);
        
        // Check labels in all languages
        let labelMatch = false;
        if (node.data.labels) {
          labelMatch = Object.values(node.data.labels).some(label => 
            label.toLowerCase().includes(query)
          );
        }
        
        return nameMatch || idMatch || labelMatch;
      }).map(node => node.data);
    } catch (error) {
      console.error('Error finding classes by query:', error);
      return [];
    }
  }
  
  // Function to display search results dropdown
  function showSearchResults(matches) {
    try {
      const searchInput = document.getElementById('class-search');
      const searchContainer = searchInput.closest('.search-box');
      
      if (!searchInput || !searchContainer) {
        console.error('Search container elements not found');
        return;
      }
      
      // Remove any existing dropdown
      const existingDropdown = document.getElementById('search-results');
      if (existingDropdown) {
        existingDropdown.remove();
      }
      
      // Create dropdown container with positioning relative to the search container
      const dropdown = document.createElement('div');
      dropdown.id = 'search-results';
      dropdown.className = 'search-results-dropdown';
      
      // Style the dropdown
      Object.assign(dropdown.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        width: '250px',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: '1000',
        marginTop: '5px'
      });
      
      // Add results to dropdown
      matches.forEach(match => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.textContent = match.name || match.id;
        
        // Style the result item
        Object.assign(resultItem.style, {
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee'
        });
        
        // Click event
        resultItem.addEventListener('click', function() {
          lastSelectedClass = match.id;
          showBranchOrFull(match.id);
          dropdown.remove();
          console.log(`Selected class: ${match.id}`);
        });
        
        dropdown.appendChild(resultItem);
      });
      
      // Position the dropdown within the search container (better for GitHub Pages)
      searchContainer.style.position = 'relative';
      searchContainer.appendChild(dropdown);
      
      // Close dropdown when clicking outside
      function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== searchInput) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      }
      
      // Use setTimeout to avoid immediate triggering
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 100);
      
      console.log('Search results dropdown created successfully');
    } catch (error) {
      console.error('Error showing search results:', error);
    }
  }
  
  // Handle file upload
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        processOntologyData(content);
      };
      reader.readAsText(file);
    }
  }
  
  // Load the default ontology
  function loadDefaultOntology() {
    fetch('ontology/domain_ontology.owl')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load default ontology');
        }
        return response.text();
      })
      .then(data => {
        processOntologyData(data);
      })
      .catch(error => {
        console.error('Error loading default ontology:', error);
        // Show a message to the user
        const infoPanel = document.getElementById('class-info');
        infoPanel.innerHTML = `
          <h3>Loading Error</h3>
          <p>Could not load the default ontology file due to browser security restrictions.</p>
          <p>Please try one of these solutions:</p>
          <ol>
            <li>Upload an ontology file using the file input above</li>
            <li>Serve this application through a local web server instead of opening it directly</li>
          </ol>
        `;
      });
  }
  
  // --- Branch View Toggle State ---
  let branchViewActive = false;
  let lastSelectedClass = null;
  let fullOntologyData = null;

  // Listen for branch view toggle
  const toggle = document.getElementById('toggle-branch-view');
  if (toggle) {
    toggle.addEventListener('change', function() {
      branchViewActive = toggle.checked;
      if (lastSelectedClass) {
        showBranchOrFull(lastSelectedClass);
      } else {
        // If no class selected, just reload full ontology
        createVisualization(fullOntologyData);
      }
    });
  }

  // Helper to show branch or full view
  function showBranchOrFull(className, skipVisualization = false) {
    // Only recreate visualization if:
    // 1. No visualization exists yet
    // 2. We're switching between branch view and full view
    // 3. We're changing which class is being shown in branch view
    // 4. Not skipping visualization (e.g., via Ctrl+click)
    const needsRecreation = !skipVisualization && (
                            !globalVisualizationState.treeData || 
                            (branchViewActive && className && window.lastBranchClassName !== className) ||
                            (!branchViewActive && window.lastBranchClassName));
    
    // Track if we're in branch view and which class is being shown
    if (branchViewActive) {
      window.lastBranchClassName = className;
    } else {
      window.lastBranchClassName = null;
    }
    
    if (needsRecreation) {
      if (branchViewActive && className) {
        const branchData = getBranchOntologyData(fullOntologyData, className);
        createVisualization(branchData);
        // Focus will be handled after visualization is created in setTimeout
        setTimeout(() => focusOnClass(className), 100);
      } else {
        createVisualization(fullOntologyData);
        // Focus after visualization is created
        setTimeout(() => focusOnClass(className), 100);
      }
    } else {
      // Just focus on the class without recreating the visualization
      focusOnClass(className);
      
      // Make sure the class info is displayed (for node clicks with modifier key)
      const matchingNode = globalVisualizationState.nodeElements?.filter(d => 
        d.data.id === className || d.data.name === className
      );
      
      if (matchingNode && matchingNode.size() > 0) {
        const node = matchingNode.datum();
        displayClassInfo(node);
      }
    }
  }

  // --- Patch processOntologyData to store full data ---
  function processOntologyData(xmlData) {
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'application/xml');
    
    // Save the parsed document for later reference
    window.ontologyDoc = xmlDoc;
    
    // Extract classes and their relationships
    const ontologyData = extractOntologyData(xmlDoc);
    fullOntologyData = ontologyData; // Store full data
    createVisualization(ontologyData);
  }
  
  // Extract detailed class axioms for display in the info panel
  function extractClassAxioms(className) {
    const xmlDoc = window.ontologyDoc;
    if (!xmlDoc) return {};
    
    // Remove disjoint classes from result
    const result = {
      subClasses: [],
      equivalentClasses: [],
      objectProperties: {}
    };
    
    // Find all classes that have this class as a superclass
    const allClasses = xmlDoc.querySelectorAll('owl\\:Class, Class');
    allClasses.forEach(classEl => {
      const about = classEl.getAttribute('rdf:about');
      if (!about) return;
      
      const currentClassName = about.split('#').pop() || about.split('/').pop();
      
      // Skip self
      if (currentClassName === className) {
        // Check for equivalentClass
        const eqClassElements = classEl.querySelectorAll('owl\\:equivalentClass, equivalentClass');
        eqClassElements.forEach(eqClass => {
          // Find the first child (should be owl:Class or owl:Restriction)
          let axiomNode = Array.from(eqClass.children).find(child => child.nodeType === 1);
          if (axiomNode) {
            const parsed = parseEquivalentClassAxiom(axiomNode);
            if (parsed) result.equivalentClasses.push(parsed);
          }
        });
        return;
      }
      
      // Check if this class has our target className as a superclass
      const subClassOfElements = classEl.querySelectorAll('rdfs\\:subClassOf, subClassOf');
      subClassOfElements.forEach(subClassEl => {
        const superClassResource = subClassEl.getAttribute('rdf:resource');
        if (superClassResource) {
          const superClassName = superClassResource.split('#').pop() || superClassResource.split('/').pop();
          if (superClassName === className) {
            result.subClasses.push(currentClassName);
          }
        }
      });
    });
    
    // Find the class element for our target class
    let targetClassElement = null;
    allClasses.forEach(classEl => {
      const about = classEl.getAttribute('rdf:about');
      if (!about) return;
      
      const currentClassName = about.split('#').pop() || about.split('/').pop();
      if (currentClassName === className) {
        targetClassElement = classEl;
      }
    });
    
    if (targetClassElement) {
      // Find object property restrictions in rdfs:subClassOf
      const subClassOfElements = targetClassElement.querySelectorAll('rdfs\\:subClassOf, subClassOf');
      subClassOfElements.forEach(subClassEl => {
        const restriction = subClassEl.querySelector('owl\\:Restriction, Restriction');
        if (restriction) {
          // Get property
          let property = null;
          let restrictionType = 'some';
          let value = null;
          const onProperty = restriction.querySelector('owl\\:onProperty, onProperty');
          if (onProperty) {
            property = onProperty.getAttribute('rdf:resource');
            property = property ? (property.split('#').pop() || property.split('/').pop()) : null;
          }
          const someValuesFrom = restriction.querySelector('owl\\:someValuesFrom, someValuesFrom');
          if (someValuesFrom) {
            value = someValuesFrom.getAttribute('rdf:resource');
            value = value ? (value.split('#').pop() || value.split('/').pop()) : null;
            restrictionType = 'some';
          }
          const allValuesFrom = restriction.querySelector('owl\\:allValuesFrom, allValuesFrom');
          if (allValuesFrom) {
            value = allValuesFrom.getAttribute('rdf:resource');
            value = value ? (value.split('#').pop() || value.split('/').pop()) : null;
            restrictionType = 'only';
          }
          if (property && value) {
            if (!result.objectProperties[property]) result.objectProperties[property] = [];
            result.objectProperties[property].push({ type: restrictionType, value });
          }
        }
      });
      
      // Look for annotation properties related to this class
      const annotationElements = targetClassElement.querySelectorAll('www\\:MALFOachieves, MALFOachieves, www\\:MALFOtransitivePosCauseOf, MALFOtransitivePosCauseOf');
      annotationElements.forEach(annotEl => {
        const annotName = annotEl.nodeName.split(':').pop();
        const annotResource = annotEl.getAttribute('rdf:resource');
        if (annotResource) {
          const annotTarget = annotResource.split('#').pop() || annotResource.split('/').pop();
          if (!result.objectProperties[annotName]) {
            result.objectProperties[annotName] = [];
          }
          result.objectProperties[annotName].push(annotTarget);
        }
      });
    }
    
    return result;
  }
  
  // Extract classes and relationships from XML
  function extractOntologyData(xmlDoc) {
    const classes = new Map();
    const relationships = [];
    
    // Get all classes
    const classElements = xmlDoc.querySelectorAll('owl\\:Class, Class');
    
    classElements.forEach(classEl => {
      const about = classEl.getAttribute('rdf:about');
      if (!about) return;
      
      // Extract class name from the URI
      const className = about.split('#').pop() || about.split('/').pop();
      
      // Extract rdfs:label elements with language tags
      const labels = {};
      const labelElements = classEl.querySelectorAll('rdfs\\:label, label');
      labelElements.forEach(label => {
        const langAttr = label.getAttribute('xml:lang') || 'en'; // Default to English if no language tag
        const text = label.textContent.trim();
        if (text) {
          labels[langAttr] = text;
        }
      });

      // Get the current language from the language selector
      const currentLang = window.currentLanguage || 'en';
      
      // Get display name using language preference with fallback to English and then to class ID
      let displayName = className;
      if (labels[currentLang]) {
        displayName = labels[currentLang];
      } else if (labels['en']) {
        displayName = labels['en'];
      }
      
      // Extract comments
      const comments = [];
      const commentElements = classEl.querySelectorAll('rdfs\\:comment, comment');
      commentElements.forEach(comment => {
        comments.push(comment.textContent.trim());
      });
      
      // Get superclasses
      const superClasses = [];
      const subClassOfElements = classEl.querySelectorAll('rdfs\\:subClassOf, subClassOf');
      subClassOfElements.forEach(subClassEl => {
        const superClassResource = subClassEl.getAttribute('rdf:resource');
        if (superClassResource) {
          const superClassName = superClassResource.split('#').pop() || superClassResource.split('/').pop();
          superClasses.push(superClassName);
        }
      });
      
      // Store class information
      classes.set(className, {
        id: className,
        name: displayName,
        comments: comments,
        superClasses: superClasses,
        labels: labels // Store all the label variations for later use
      });
    });
    
    // Create relationships
    classes.forEach(cls => {
      cls.superClasses.forEach(superClass => {
        if (classes.has(superClass)) {
          relationships.push({
            source: superClass,
            target: cls.id,
            type: 'subClassOf'
          });
        }
      });
    });
    
    return {
      nodes: Array.from(classes.values()),
      links: relationships
    };
  }
  
  // Global reference to store visualization components
  let globalVisualizationState = {
    svg: null,
    g: null,
    nodeElements: null,
    zoom: null,
    treeData: null,
    width: 0,
    height: 0
  };
  
  // Function to find and focus on a specific class
  function focusOnClass(className) {
    // Find the node with the matching class name
    const matchingNode = globalVisualizationState.nodeElements.filter(d => 
      d.data.id === className || d.data.name === className
    );
    
    if (matchingNode.size() > 0) {
      // Get the first matching node
      const node = matchingNode.datum();
      const svg = globalVisualizationState.svg;
      const zoomBehavior = globalVisualizationState.zoom;
      const targetScale = 1.5; // Desired zoom level
      
      // Get the current transform state
      const currentTransform = d3.zoomTransform(svg.node());
      
      // Check if current layout is vertical or horizontal
      const isVertical = document.getElementById('layout-direction').value === 'vertical';
      
      // Target node coordinates (layout coordinates from d3.tree)
      // Use the proper coordinates based on layout direction
      const targetX = isVertical ? node.x : node.y;
      const targetY = isVertical ? node.y : node.x;
      
      // Get the width and height of the container
      const width = globalVisualizationState.width;
      const height = globalVisualizationState.height;
      
      // Calculate the transform that centers the node
      // For this we need to transform the node coordinates to screen coordinates
      const newX = width / 2 - targetX * targetScale;
      const newY = height / 2 - targetY * targetScale;
      
      // Create a new transform that centers on the node with the desired scale
      const newTransform = d3.zoomIdentity
        .translate(newX, newY)
        .scale(targetScale);
      
      // Transition to the new transform
      svg.transition()
        .duration(750)
        .call(zoomBehavior.transform, newTransform);

      // Highlight the node
      globalVisualizationState.nodeElements.classed('selected', false);
      matchingNode.classed('selected', true);
      
      // Show the class info
      displayClassInfo(node);
    }
  }
  
  // Function to get the localized label for a class
  function getLocalizedLabel(classId) {
    const currentLang = window.currentLanguage || 'en';
    const nodes = Array.from(globalVisualizationState.treeData.descendants());
    
    // Find the node matching this class ID
    const matchingNode = nodes.find(node => node.data.id === classId);
    
    if (matchingNode && matchingNode.data.labels) {
      // If there's a label in the current language, use it
      if (matchingNode.data.labels[currentLang]) {
        return matchingNode.data.labels[currentLang];
      } 
      // Fallback to English
      else if (matchingNode.data.labels['en']) {
        return matchingNode.data.labels['en'];
      }
    }
    
    // If no matching label found, return the class ID
    return classId;
  }
  
  // Function to display class information
  function displayClassInfo(d) {
    if (d.data.id === "OntologyRoot") return; // Skip the virtual root
      
    // Display class information
    const infoPanel = document.getElementById('class-info');
    let html = `<h3>${d.data.name}</h3>`;
    
    // Display all axioms for the class
    const className = d.data.id;
    const classDetails = extractClassAxioms(className);
    
    // Display comments
    if (d.data.comments && d.data.comments.length > 0) {
      html += '<h4>Comments:</h4>';
      d.data.comments.forEach(comment => {
        html += `<div class="comment">${comment}</div>`;
      });
    } else {
      html += '<p>No comments available.</p>';
    }
    
    // Display available language labels if they exist
    if (d.data.labels && Object.keys(d.data.labels).length > 0) {
      html += '<h4>Available Labels:</h4><ul>';
      for (const [lang, label] of Object.entries(d.data.labels)) {
        html += `<li><strong>${lang}:</strong> ${label}</li>`;
      }
      html += '</ul>';
    }
    
    // Display superclasses
    if (d.data.superClasses && d.data.superClasses.length > 0) {
      html += '<h4>Superclasses:</h4><ul>';
      d.data.superClasses.forEach(superClass => {
        const superClassLabel = getLocalizedLabel(superClass);
        html += `<li><a href="#" class="class-link" data-class="${superClass}">${superClassLabel}</a></li>`;
      });
      html += '</ul>';
    }
    
    // Display subclasses
    if (classDetails.subClasses && classDetails.subClasses.length > 0) {
      html += '<h4>Subclasses:</h4><ul>';
      classDetails.subClasses.forEach(subClass => {
        const subClassLabel = getLocalizedLabel(subClass);
        html += `<li><a href="#" class="class-link" data-class="${subClass}">${subClassLabel}</a></li>`;
      });
      html += '</ul>';
    }
    
    // Display equivalent classes
    if (classDetails.equivalentClasses && classDetails.equivalentClasses.length > 0) {
      html += '<h4>Equivalent To:</h4>';
      html += '<div class="equivalent-axiom">';
      classDetails.equivalentClasses.forEach(eq => {
        html += renderEquivalentAxiom(eq);
      });
      html += '</div>';
    }
    
    // Display restrictions
    if (classDetails.objectProperties && Object.keys(classDetails.objectProperties).length > 0) {
      html += '<h4>Restrictions:</h4><ul>';
      for (const [property, values] of Object.entries(classDetails.objectProperties)) {
        values.forEach(value => {
          if (typeof value === 'object' && value !== null && value.value) {
            const valueLabel = getLocalizedLabel(value.value);
            const typeLabel = value.type === 'only' ? 'only' : (value.type === 'some' ? 'some' : value.type);
            html += `<li><a href="#" class="property-link" data-property="${property}">${property}</a> ${typeLabel} <a href="#" class="class-link" data-class="${value.value}">${valueLabel}</a></li>`;
          } else if (typeof value === 'string' && value && !value.startsWith('Domain of') && !value.startsWith('Range of')) {
            const valueLabel = getLocalizedLabel(value);
            html += `<li><a href="#" class="property-link" data-property="${property}">${property}</a> only <a href="#" class="class-link" data-class="${value}">${valueLabel}</a></li>`;
          }
        });
      }
      html += '</ul>';
    }

    infoPanel.innerHTML = html;

    // Add event listeners to class links
    document.querySelectorAll('.class-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetClass = this.getAttribute('data-class');
        lastSelectedClass = targetClass;
        showBranchOrFull(targetClass);
      });
    });
    // Add event listeners to property links
    document.querySelectorAll('.property-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const propName = this.getAttribute('data-property');
        showPropertyComment(propName);
      });
    });
  }

  // --- Recursive parser for equivalentClass axioms ---
  function parseEquivalentClassAxiom(node) {
    if (!node) return null;
    // Named class
    if ((node.nodeName.endsWith('Class') || node.nodeName.endsWith('Description')) && node.getAttribute('rdf:about')) {
      const about = node.getAttribute('rdf:about');
      return { type: 'named', value: about.split('#').pop() || about.split('/').pop() };
    }
    // Intersection (AND)
    const intersection = node.querySelector(':scope > owl\\:intersectionOf, :scope > intersectionOf');
    if (intersection) {
      // Support both rdf:Description/Description and owl:Class/Class children
      const items = Array.from(intersection.children).map(parseEquivalentClassAxiom).filter(Boolean);
      return { type: 'intersection', operands: items };
    }
    // Union (OR)
    const union = node.querySelector(':scope > owl\\:unionOf, :scope > unionOf');
    if (union) {
      const items = Array.from(union.children).map(parseEquivalentClassAxiom).filter(Boolean);
      return { type: 'union', operands: items };
    }
    // Complement (NOT)
    const complement = node.querySelector(':scope > owl\\:complementOf, :scope > complementOf');
    if (complement) {
      // complementOf can be a resource or a child node
      const resource = complement.getAttribute('rdf:resource');
      if (resource) {
        return { type: 'not', operand: { type: 'named', value: resource.split('#').pop() || resource.split('/').pop() } };
      } else {
        // Try to find a child node
        const child = Array.from(complement.children).find(child => child.nodeType === 1);
        if (child) {
          return { type: 'not', operand: parseEquivalentClassAxiom(child) };
        }
      }
      // If nothing found, still return not with empty operand
      return { type: 'not', operand: null };
    }
    // Restriction
    if (node.nodeName.endsWith('Restriction')) {
      let property = null;
      let restrictionType = 'some';
      let value = null;
      const onProperty = node.querySelector(':scope > owl\\:onProperty, :scope > onProperty');
      if (onProperty) {
        // Check for inverseOf
        const propDesc = onProperty.querySelector(':scope > rdf\\:Description, :scope > Description');
        if (propDesc) {
          const invOf = propDesc.querySelector(':scope > owl\\:inverseOf, :scope > inverseOf');
          if (invOf) {
            const invRes = invOf.getAttribute('rdf:resource');
            property = invRes ? `inverse(${invRes.split('#').pop() || invRes.split('/').pop()})` : null;
          }
          // If not inverseOf, check for nested restriction property (for nested restrictions as value)
          if (!property) {
            // If the property is a restriction, parse recursively
            const nestedRestriction = propDesc.querySelector(':scope > owl\\:Restriction, :scope > Restriction');
            if (nestedRestriction) {
              // Recursively parse the nested restriction as the value
              value = parseEquivalentClassAxiom(nestedRestriction);
            }
          }
        }
        if (!property) {
          property = onProperty.getAttribute('rdf:resource');
          property = property ? (property.split('#').pop() || property.split('/').pop()) : null;
        }
      }
      // If value is not set by nested restriction, check for someValuesFrom/allValuesFrom
      if (!value) {
        const someValuesFrom = node.querySelector(':scope > owl\\:someValuesFrom, :scope > someValuesFrom');
        if (someValuesFrom) {
          // If someValuesFrom is a restriction, parse recursively
          const nestedRestriction = someValuesFrom.querySelector(':scope > owl\\:Restriction, :scope > Restriction');
          if (nestedRestriction) {
            value = parseEquivalentClassAxiom(nestedRestriction);
          } else {
            const v = someValuesFrom.getAttribute('rdf:resource');
            value = v ? (v.split('#').pop() || v.split('/').pop()) : null;
          }
          restrictionType = 'some';
        }
        const allValuesFrom = node.querySelector(':scope > owl\\:allValuesFrom, :scope > allValuesFrom');
        if (allValuesFrom) {
          const nestedRestriction = allValuesFrom.querySelector(':scope > owl\\:Restriction, :scope > Restriction');
          if (nestedRestriction) {
            value = parseEquivalentClassAxiom(nestedRestriction);
          } else {
            const v = allValuesFrom.getAttribute('rdf:resource');
            value = v ? (v.split('#').pop() || v.split('/').pop()) : null;
          }
          restrictionType = 'only';
        }
      }
      // Cardinality restrictions can be added here if needed
      return { type: 'restriction', property, value, restrictionType };
    }
    return null;
  }

  // --- Recursive renderer for equivalentClass axioms ---
  function renderEquivalentAxiom(eq) {
    if (!eq) return '';
    if (eq.type === 'named') {
      const eqClassLabel = getLocalizedLabel(eq.value);
      return `<span class="eq-class"><a href="#" class="class-link" data-class="${eq.value}">${eqClassLabel}</a></span>`;
    } else if (eq.type === 'intersection') {
      return eq.operands.map(renderEquivalentAxiom).join(' <span class="eq-and">and</span> ');
    } else if (eq.type === 'union') {
      return '(' + eq.operands.map(renderEquivalentAxiom).join(' <span class="eq-or">or</span> ') + ')';
    } else if (eq.type === 'not') {
      return '(not ' + renderEquivalentAxiom(eq.operand) + ')';
    } else if (eq.type === 'restriction') {
      let restrictionLabel = eq.restrictionType === 'some' ? 'some' : eq.restrictionType;
      // Prepare the clickable property name
      const propLink = `<a href="#" class="property-link" data-property="${eq.property}">${eq.property}</a>`;
      // If value is a named class or nested axiom, render appropriately
      let valueRendered = '';
      if (typeof eq.value === 'object' && eq.value !== null) {
        valueRendered = renderEquivalentAxiom(eq.value);
      } else if (typeof eq.value === 'string' && eq.value) {
        valueRendered = `<span class=\"eq-class\"><a href=\"#\" class=\"class-link\" data-class=\"${eq.value}\">${getLocalizedLabel(eq.value)}</a></span>`;
      }
      return `(${propLink} <span class="eq-some">${restrictionLabel}</span> ${valueRendered})`;
    } else {
      return `<span class="eq-complex">?</span>`;
    }
  }

  // Create D3 visualization
  function createVisualization(data) {
    // Clear previous visualization
    d3.select('#ontology-graph').html('');
    
    const width = document.getElementById('ontology-graph').clientWidth;
    const height = document.getElementById('ontology-graph').clientHeight;
    
    // Get selected layout direction
    const isVertical = document.getElementById('layout-direction').value === 'vertical';
    
    // Store dimensions in global state
    globalVisualizationState.width = width;
    globalVisualizationState.height = height;
    
    // Create SVG element
    const svg = d3.select('#ontology-graph')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Define the initial transform for the 'g' element
    const initialTranslateX = width / 2;
    const initialTranslateY = 60;
    const initialTransform = d3.zoomIdentity.translate(initialTranslateX, initialTranslateY);

    // Create the main group element FIRST and apply the initial transform
    const g = svg.append('g')
      .attr('transform', initialTransform);
    
    // Create zoom behavior - now it can safely reference 'g'
    const zoom = d3.zoom()
      .on('zoom', function(event) {
        g.attr('transform', event.transform);
      });
    
    // Apply zoom to SVG and explicitly set the initial zoom state
    // This will trigger the zoom handler, which now safely references 'g'
    svg.call(zoom)
       .call(zoom.transform, initialTransform); 
    
    // Store references in global state
    globalVisualizationState.svg = svg;
    globalVisualizationState.g = g; // g is already defined
    globalVisualizationState.zoom = zoom;
    
    // Create a hierarchy from the data
    // First, build a map for quick lookup
    const nodeMap = {};
    data.nodes.forEach(node => {
      nodeMap[node.id] = { ...node, children: [], parents: [], treePath: [] };
    });
    
    // Create primary tree structure, but track all parent-child relationships
    const childNodes = new Set();
    const allRelationships = [];
    
    // First pass - identify all parent-child relationships
    data.links.forEach(link => {
      if (nodeMap[link.source] && nodeMap[link.target]) {
        // Add to all relationships
        allRelationships.push({
          source: link.source,
          target: link.target,
          type: link.type
        });
        
        // Record the parent relationship for the child
        nodeMap[link.target].parents.push(link.source);
        childNodes.add(link.target);
      }
    });
    
    // Second pass - create primary tree structure (one parent per node)
    // For nodes with multiple parents, we pick one for the primary structure
    data.links.forEach(link => {
      if (nodeMap[link.source] && nodeMap[link.target]) {
        // Only add the child to parent in the tree if it's not already someone else's child
        // or if this is its first parent in our iteration
        if (!nodeMap[link.target].treePath.length) {
          nodeMap[link.source].children.push(nodeMap[link.target]);
          nodeMap[link.target].treePath.push(link.source); // Record the path
        }
      }
    });
    
    // Find root nodes (nodes that aren't children)
    const rootNodes = data.nodes.filter(node => !childNodes.has(node.id));
    
    // Create the hierarchy with a root node if there are multiple roots
    let root;
    if (rootNodes.length > 1) {
      // Create a virtual root
      root = { id: "OntologyRoot", name: "Ontology Root", children: rootNodes.map(node => nodeMap[node.id]), parents: [] };
    } else if (rootNodes.length === 1) {
      root = nodeMap[rootNodes[0].id];
    } else {
      // No clear root, just pick the first node
      root = nodeMap[data.nodes[0].id];
    }
    
    // Initial tree layout with moderate spacing - we'll adjust positions later
    const treeLayout = d3.tree()
      .size([width - 100, height - 120])
      .nodeSize([100, 120]); // Start with smaller horizontal spacing
    
    // Convert to a hierarchy for the tree layout
    const hierarchy = d3.hierarchy(root);
    
    // Compute the layout
    const treeData = treeLayout(hierarchy);
    
    // Calculate actual box widths for each node
    const boxWidths = {};
    treeData.descendants().forEach(node => {
      const textLength = node.data.name.length;
      const charWidth = 9; // Character width
      const padding = 20; // Fixed padding
      boxWidths[node.data.id] = textLength * charWidth + padding;
    });
    
    // Adjust node positions to prevent overlapping
    // Group nodes by their depth (y value)
    const nodesByLevel = {};
    treeData.descendants().forEach(node => {
      const level = Math.round(node.depth); // Get the depth level
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(node);
    });
    
    // For each level, adjust horizontal positions
    Object.keys(nodesByLevel).forEach(level => {
      const nodesAtLevel = nodesByLevel[level];
      
      // Sort nodes by x position
      nodesAtLevel.sort((a, b) => a.x - b.x);
      
      // Start with the left-most node
      for (let i = 1; i < nodesAtLevel.length; i++) {
        const prevNode = nodesAtLevel[i - 1];
        const currNode = nodesAtLevel[i];
        
        // Calculate minimum required distance
        const prevWidth = boxWidths[prevNode.data.id] / 2;
        const currWidth = boxWidths[currNode.data.id] / 2;
        const minDistance = prevWidth + currWidth;
        
        // Check if boxes would overlap
        const actualDistance = currNode.x - prevNode.x;
        if (actualDistance < minDistance) {
          // Adjust position of current node and all its descendants
          const shift = minDistance - actualDistance;
          currNode.x += shift;
          
          // Shift all descendants as well
          treeData.descendants().forEach(node => {
            if (node !== currNode && isDescendant(currNode, node)) {
              node.x += shift;
            }
          });
        }
      }
    });
    
    // Helper function to check if node is a descendant of parent
    function isDescendant(parent, node) {
      while (node.parent) {
        if (node.parent === parent) {
          return true;
        }
        node = node.parent;
      }
      return false;
    }
    
    // Store the node positions
    const nodePositions = {};
    treeData.descendants().forEach(node => {
      nodePositions[node.data.id] = { x: node.x, y: node.y };
    });
    
    // Set up arrow markers for links - with different styles for primary/secondary connections
    const defs = svg.append('defs');
    
    // Primary connection arrow (darker, larger)
    defs.append('marker')
      .attr('id', 'arrowhead-primary')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#666');
      
    // Secondary connection arrow (lighter, smaller)  
    defs.append('marker')
      .attr('id', 'arrowhead-secondary')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');
    
    // Create all links for the visualization, including secondary parent-child relationships
    const allLinks = [];
    
    // Create a nodeById lookup for connecting links directly to nodes
    const nodeById = {};
    treeData.descendants().forEach(node => {
      nodeById[node.data.id] = node;
    });
    
    // Add primary tree links first (directly reference the node objects)
    treeData.links().forEach(link => {
      allLinks.push({
        source: link.source,
        target: link.target,
        primary: true
      });
    });
    
    // Add additional links for multiple inheritance
    allRelationships.forEach(rel => {
      // Get source and target nodes by ID
      const sourceNode = nodeById[rel.source];
      const targetNode = nodeById[rel.target];
      
      if (sourceNode && targetNode) {
        // Skip if this is already represented in the primary tree
        const targetData = nodeMap[rel.target];
        const isInPrimaryTree = targetData.treePath[0] === rel.source;
        
        if (!isInPrimaryTree) {
          allLinks.push({
            source: sourceNode,
            target: targetNode,
            primary: false
          });
        }
      }
    });
    
    // Draw links
    const link = g.selectAll('.link')
      .data(allLinks)
      .enter()
      .append('path')
      .attr('class', d => d.primary ? 'link primary' : 'link secondary')
      .attr('d', createLinkPath)
      .attr('stroke', d => d.primary ? '#666' : '#999')
      .attr('stroke-width', d => d.primary ? 1.5 : 1)
      .attr('stroke-dasharray', d => d.primary ? 'none' : '5,3')
      .attr('marker-end', d => d.primary ? 'url(#arrowhead-primary)' : 'url(#arrowhead-secondary)');
      
    // Function to create link paths
    function createLinkPath(d) {
      if (isVertical) {
        // Vertical layout - connections flow top to bottom
        return `M${d.source.x},${d.source.y}
                C${d.source.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${d.target.y}`;
      } else {
        // Horizontal layout - connections flow left to right
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      }
    }
    
    // Create node groups
    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        // Position based on layout direction
        return isVertical 
          ? `translate(${d.x}, ${d.y})` // Vertical layout
          : `translate(${d.y}, ${d.x})`; // Horizontal layout
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Store node references in global state
    globalVisualizationState.nodeElements = node;
    globalVisualizationState.treeData = treeData;
    
    // Add rectangles for nodes - with better proportional sizing to text
    node.append('rect')
      .attr('width', d => {
        // Calculate width based on name length with a fixed padding on each side
        const textLength = d.data.name.length;
        const charWidth = 7.2;  // Average character width
        const padding = 20;     // Fixed padding (10px on each side)
        return textLength * charWidth + padding;
      })
      .attr('height', 26)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('x', d => {
        const textLength = d.data.name.length;
        const charWidth = 7.2;
        const padding = 20;
        return -(textLength * charWidth + padding) / 2;
      })
      .attr('y', -13)
      .attr('fill', d => {
        if (d.data.id === "OntologyRoot") return "#cccccc";
        // Check if the class has multiple parents (stronger color for multi-inheritance)
        return d.data.parents && d.data.parents.length > 1 ? "#4b8f77" : "#69b3a2";
      })
      .attr('fill-opacity', 0.8);
    
    // Add text to nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', 'white')
      .text(d => d.data.name);
    
    // Add click event to nodes
    node.on('click', function(event, d) {
      if (d.data.id === "OntologyRoot") return;
      
      // Store the last selected class ID
      lastSelectedClass = d.data.id;
      
      // Pass the modifier keys to showBranchOrFull
      showBranchOrFull(d.data.id, event.ctrlKey || event.metaKey);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      event.sourceEvent.stopPropagation();
      
      // Store the initial offset differently based on layout direction
      if (isVertical) {
        d.dragOffsetX = d.x - event.x;
        d.dragOffsetY = d.y - event.y;
      } else {
        d.dragOffsetX = d.y - event.x;
        d.dragOffsetY = d.x - event.y;
      }
    }
    
    function dragged(event, d) {
      // Apply the drag with the initial offset maintained based on layout direction
      if (isVertical) {
        d.x = event.x + d.dragOffsetX;
        d.y = event.y + d.dragOffsetY;
      } else {
        d.y = event.x + d.dragOffsetX;
        d.x = event.y + d.dragOffsetY;
      }
      
      // Update dragged node position
      d3.select(this).attr("transform", isVertical 
        ? `translate(${d.x}, ${d.y})` 
        : `translate(${d.y}, ${d.x})`);
      
      // Update links connected to the dragged node
      link.filter(linkData => linkData.source === d || linkData.target === d)
          .attr('d', linkData => {
              // Use the updated coordinates for the dragged node (d)
              // and the existing coordinates for the other end.
              const sourceNode = linkData.source;
              const targetNode = linkData.target;

              // Get coordinates, using the dragged node's updated position
              const sourceX = sourceNode === d ? d.x : sourceNode.x;
              const sourceY = sourceNode === d ? d.y : sourceNode.y;
              const targetX = targetNode === d ? d.x : targetNode.x;
              const targetY = targetNode === d ? d.y : targetNode.y;

              // Add a check for missing coordinates
              if (sourceX === undefined || sourceY === undefined || targetX === undefined || targetY === undefined) {
                  console.warn("Skipping link draw due to missing coordinates", linkData);
                  return "M0,0"; // Return a minimal path to avoid error
              }

              if (isVertical) {
                  // Vertical layout path calculation
                  return `M${sourceX},${sourceY}
                          C${sourceX},${(sourceY + targetY) / 2}
                           ${targetX},${(sourceY + targetY) / 2}
                           ${targetX},${targetY}`;
              } else {
                  // Horizontal layout path calculation (swap x and y)
                  return `M${sourceY},${sourceX}
                          C${(sourceY + targetY) / 2},${sourceX}
                           ${(sourceY + targetY) / 2},${targetX}
                           ${targetY},${targetX}`;
              }
          });
    }
    
    function dragended(event, d) {
      // Clean up the drag offset properties
      delete d.dragOffsetX;
      delete d.dragOffsetY;
    }
  }

  // --- Branch extraction logic ---
  function getBranchOntologyData(data, className) {
    // Find the node for className
    const nodeMap = {};
    data.nodes.forEach(n => nodeMap[n.id] = {...n});
    // Find all subclasses recursively
    const subclasses = new Set();
    function findSubclasses(id) {
      data.links.forEach(link => {
        if (link.source === id) {
          subclasses.add(link.target);
          findSubclasses(link.target);
        }
      });
    }
    findSubclasses(className);
    // Find all superclasses recursively
    const superclasses = new Set();
    function findSuperclasses(id) {
      data.links.forEach(link => {
        if (link.target === id) {
          superclasses.add(link.source);
          findSuperclasses(link.source);
        }
      });
    }
    findSuperclasses(className);
    // Collect all relevant node ids
    const nodeIds = new Set([className, ...subclasses, ...superclasses]);
    // Filter nodes and links
    const nodes = data.nodes.filter(n => nodeIds.has(n.id));
    const links = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
    return { nodes, links };
  }
});

// Function to extract an object property's rdfs:comment
function extractPropertyComment(propName) {
  const xmlDoc = window.ontologyDoc;
  if (!xmlDoc) return null;
  const propEls = xmlDoc.querySelectorAll('owl\\:ObjectProperty, ObjectProperty');
  for (const el of propEls) {
    const about = el.getAttribute('rdf:about');
    if (!about) continue;
    const id = about.split('#').pop() || about.split('/').pop();
    if (id === propName) {
      const commentEl = el.querySelector('rdfs\\:comment, comment');
      if (commentEl) {
        return commentEl.textContent.trim();
      }
    }
  }
  return null;
}

// Function to display the property comment box
function showPropertyComment(propName) {
  const comment = extractPropertyComment(propName);
  const infoPanel = document.getElementById('class-info');
  const existing = document.getElementById('property-comment-box');
  if (existing) existing.remove();
  let commentHTML = `<div id="property-comment-box"><h4>Property Comment: ${propName}</h4>`;
  if (comment) {
    commentHTML += `<p>${comment}</p>`;
  } else {
    commentHTML += `<p>No comment available.</p>`;
  }
  commentHTML += `</div>`;
  infoPanel.insertAdjacentHTML('beforeend', commentHTML);
}
