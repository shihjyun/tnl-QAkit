
// set css variables helper function
function setCssVariables(node, variables) {
  for (const name in variables) {
    node.style.setProperty(`--${name}`, variables[name])
  }
}

// svelte action function for setting css variables
function cssVariables(node, variables) {
  setCssVariables(node, variables);
  
  return {
    update(variables) {
      setCssVariables(node, variables);
    }
  }
}

// helper function that help answer click to change card height
function changeCardSectionHeight(questNumber) {
  const section = document.getElementById('qa-no-' + questNumber)
  const newSectionHeight = document.querySelector('#qa-no-' + questNumber + ' > div').getBoundingClientRect().height + 'px'
  const originalSectionHeight = section.style.height

  if (+newSectionHeight.replace('px', '') > +originalSectionHeight.replace('px', '')) {
    section.style.height = newSectionHeight
  }
}

// get all sections' height
function getAllSectionsHeight(){
  let sectionHeightList = []
  const sections = document.querySelectorAll('[id^="qa-no-"]')
  
  for (let i = 0; i < sections.length; i++) {
    sectionHeightList.push(sections[i].getBoundingClientRect().height)
  }
  return(sectionHeightList)
}

export {cssVariables, setCssVariables, changeCardSectionHeight, getAllSectionsHeight}