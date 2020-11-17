
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

export {cssVariables, setCssVariables}