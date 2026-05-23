import * as XLSX from 'xlsx';

/**
 * Parses the "Estimacion" Excel file to extract both the estimation data and the catalog mapping sheets.
 * Resolves with { estimation, catalog, warnings }
 */
export const parseEstimationExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellFormula: false, cellHTML: false, cellNF: false });
        
        const sheet = workbook.Sheets['Estimacion'];
        if (!sheet) {
          throw new Error('No se encontró la pestaña "Estimacion" en el archivo');
        }

        const getVal = (cellRef) => {
          const cell = sheet[cellRef];
          return cell ? cell.v : null;
        };

        // Extract global configuration variables
        const rawRisk = getVal('K8');
        let globalRisk = Number(rawRisk) || 0.10;
        if (globalRisk > 1) {
          globalRisk = globalRisk / 100; // convert 10 to 0.10
        }

        const rawRate = getVal('H8');
        const hourlyRate = Number(rawRate) || 0;

        const rawHoursDay = getVal('E8');
        const hoursPerDay = Number(rawHoursDay) || 8;

        const estimation = {
          planBase: getVal('B6') ? String(getVal('B6')).trim() : '',
          projectType: getVal('E6') ? String(getVal('E6')).trim() : '',
          client: getVal('H6') ? String(getVal('H6')).trim() : '',
          date: getVal('K6') ? new Date(getVal('K6')) : new Date(),
          project: getVal('B7') ? String(getVal('B7')).trim() : '',
          responsible: getVal('E7') ? String(getVal('E7')).trim() : '',
          environment: getVal('H7') ? String(getVal('H7')).trim() : '',
          priority: getVal('K7') ? String(getVal('K7')).trim() : '',
          title: getVal('B8') ? String(getVal('B8')).trim() : 'Estimación de Proyecto',
          hoursPerDay,
          hourlyRate,
          globalRisk,
          currency: getVal('B9') ? String(getVal('B9')).trim() : 'COP',
          scope: getVal('E9') ? String(getVal('E9')).trim() : '',
          assumptions: getVal('H9') ? String(getVal('H9')).trim() : '',
          cost: {
            enabled: hourlyRate > 0,
            hourlyRate,
            currency: getVal('B9') ? String(getVal('B9')).trim() : 'COP',
            subtotal: 0,
            total: 0,
            notes: ''
          }
        };

        const activities = [];
        const warnings = [];

        // Helper to parse standard and additional rows
        const parseRowRange = (startRow, endRow, isAdditional = false) => {
          for (let r = startRow; r <= endRow; r++) {
            // Check if there is an activity name
            // For standard rows, Col C is name (Col index 2). Col A is origin.
            // For additional, Col A is name (Col index 0).
            const nameCell = sheet[XLSX.utils.encode_cell({ r: r - 1, c: isAdditional ? 0 : 2 })];
            const name = nameCell ? nameCell.v : null;
            if (!name || String(name).trim() === '') continue;

            const getRowVal = (colIdx) => {
              const cell = sheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            let act = {};
            if (!isAdditional) {
              // Cols: A: Origen, B: Fase, C: Actividad, D: Descripcion, E: Tipo, F: Rol, G: Complejidad, H: Cantidad, I: HorasBase, J: Factor, K: RiesgoPorcentaje, L: HorasEstimadas, M: Dias, N: Dependencia
              const rawRiskPercent = Number(getRowVal(10)) || 0;
              act = {
                origin: getRowVal(0) ? String(getRowVal(0)).trim() : 'Plan',
                phase: getRowVal(1) ? String(getRowVal(1)).trim() : '',
                name: String(getRowVal(2)).trim(),
                description: getRowVal(3) ? String(getRowVal(3)).trim() : '',
                type: getRowVal(4) ? String(getRowVal(4)).trim() : '',
                role: getRowVal(5) ? String(getRowVal(5)).trim() : '',
                complexity: getRowVal(6) ? String(getRowVal(6)).trim() : '',
                quantity: Number(getRowVal(7)) ?? 1,
                baseHours: Number(getRowVal(8)) || 0,
                factor: Number(getRowVal(9)) || 1,
                riskPercent: rawRiskPercent > 1 ? rawRiskPercent / 100 : rawRiskPercent,
                estimatedHours: Number(getRowVal(11)) || 0,
                days: Number(getRowVal(12)) || 0,
                dependency: getRowVal(13) ? String(getRowVal(13)).trim() : ''
              };
            } else {
              // Adicional cols: A: ActividadAdicional, B: Cantidad, C: Fase, D: Descripcion, E: Tipo, F: Rol, G: Complejidad, H: HorasBase, I: Factor, J: RiesgoPorcentaje, K: HorasEstimadas, L: Dias, M: Dependencia
              const rawRiskPercent = Number(getRowVal(9)) || 0;
              act = {
                origin: 'Adicional',
                name: String(getRowVal(0)).trim(),
                quantity: Number(getRowVal(1)) ?? 1,
                phase: getRowVal(2) ? String(getRowVal(2)).trim() : '',
                description: getRowVal(3) ? String(getRowVal(3)).trim() : '',
                type: getRowVal(4) ? String(getRowVal(4)).trim() : '',
                role: getRowVal(5) ? String(getRowVal(5)).trim() : '',
                complexity: getRowVal(6) ? String(getRowVal(6)).trim() : '',
                baseHours: Number(getRowVal(7)) || 0,
                factor: Number(getRowVal(8)) || 1,
                riskPercent: rawRiskPercent > 1 ? rawRiskPercent / 100 : rawRiskPercent,
                estimatedHours: Number(getRowVal(10)) || 0,
                days: Number(getRowVal(11)) || 0,
                dependency: getRowVal(12) ? String(getRowVal(12)).trim() : ''
              };
            }

            // Calculation safety checks
            if (!act.estimatedHours) {
              act.estimatedHours = Math.round((act.quantity * act.baseHours * act.factor * (1 + act.riskPercent)) * 100) / 100;
            }
            if (!act.days) {
              act.days = Math.round((act.estimatedHours / hoursPerDay) * 100) / 100;
            }

            if (!act.phase) {
              warnings.push(`Fila ${r}: La actividad "${act.name}" no cuenta con fase asignada. Se asignará "General".`);
              act.phase = 'General';
            }

            activities.push(act);
          }
        };

        // Parse Plan Base: rows 20-44
        parseRowRange(20, 44, false);
        // Parse Packages: rows 59-94
        parseRowRange(59, 94, false);
        // Parse Additionals: rows 101-122
        parseRowRange(101, 122, true);

        estimation.activities = activities;

        // Recalculate summary from parsed activities
        let subtotalHours = 0;
        activities.forEach(a => { subtotalHours += a.estimatedHours; });
        subtotalHours = Math.round(subtotalHours * 100) / 100;
        const riskHours = Math.round((subtotalHours * globalRisk) * 100) / 100;
        const totalHours = Math.round((subtotalHours + riskHours) * 100) / 100;
        const totalDays = Math.round((totalHours / hoursPerDay) * 100) / 100;
        const weeks = Math.round((totalDays / 5) * 100) / 100;
        const estimatedCost = Math.round((totalHours * hourlyRate) * 100) / 100;

        estimation.summary = {
          subtotalHours,
          riskHours,
          totalHours,
          totalDays,
          weeks,
          estimatedCost,
          executiveNote: ''
        };

        estimation.cost.subtotal = subtotalHours * hourlyRate;
        estimation.cost.total = totalHours * hourlyRate;

        // Parse Catalog data if mapping sheets exist
        const catalog = {
          activities: [],
          plans: [],
          packages: [],
          config: {}
        };

        // Catalogo Activities
        const catSheet = workbook.Sheets['Catalogo'];
        if (catSheet) {
          for (let r = 5; r <= 200; r++) {
            const nameCell = catSheet[XLSX.utils.encode_cell({ r: r - 1, c: 1 })]; // Col B (actividad)
            const name = nameCell ? nameCell.v : null;
            if (!name || String(name).trim() === '') continue;

            const getRowVal = (colIdx) => {
              const cell = catSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            const riskPct = Number(getRowVal(8)) || 0;
            catalog.activities.push({
              code: String(getRowVal(0) || `ACT-${r}`),
              name: String(name).trim(),
              phase: getRowVal(2) ? String(getRowVal(2)).trim() : 'General',
              description: getRowVal(3) ? String(getRowVal(3)).trim() : '',
              type: getRowVal(4) ? String(getRowVal(4)).trim() : '',
              role: getRowVal(5) ? String(getRowVal(5)).trim() : '',
              complexity: getRowVal(6) ? String(getRowVal(6)).trim() : 'Media',
              baseHours: Number(getRowVal(7)) || 0,
              riskPercent: riskPct > 1 ? riskPct / 100 : riskPct,
              dependency: getRowVal(9) ? String(getRowVal(9)).trim() : ''
            });
          }
        }

        // Planes mapping
        const planSheet = workbook.Sheets['Planes'];
        if (planSheet) {
          const plansList = [];
          for (let r = 5; r <= 30; r++) {
            const nameCell = planSheet[XLSX.utils.encode_cell({ r: r - 1, c: 0 })]; // Col A (plan)
            const name = nameCell ? nameCell.v : null;
            if (!name || String(name).trim() === '') continue;

            const getRowVal = (colIdx) => {
              const cell = planSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            plansList.push({
              name: String(name).trim(),
              type: getRowVal(1) ? String(getRowVal(1)).trim() : '',
              idealFor: getRowVal(2) ? String(getRowVal(2)).trim() : '',
              description: getRowVal(3) ? String(getRowVal(3)).trim() : '',
              includes: getRowVal(4) ? String(getRowVal(4)).trim() : '',
              observations: getRowVal(5) ? String(getRowVal(5)).trim() : '',
              activities: []
            });
          }

          for (let r = 16; r <= 200; r++) {
            const planNameCell = planSheet[XLSX.utils.encode_cell({ r: r - 1, c: 0 })]; // Col A
            const planName = planNameCell ? String(planNameCell.v).trim() : null;
            if (!planName) continue;

            const actNameCell = planSheet[XLSX.utils.encode_cell({ r: r - 1, c: 1 })]; // Col B
            const actName = actNameCell ? String(actNameCell.v).trim() : null;
            if (!actName) continue;

            const getRowVal = (colIdx) => {
              const cell = planSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            const targetPlan = plansList.find(p => p.name === planName);
            if (targetPlan) {
              targetPlan.activities.push({
                activityName: actName,
                quantity: Number(getRowVal(2)) || 1,
                order: Number(getRowVal(3)) || 0
              });
            }
          }
          catalog.plans = plansList;
        }

        // Paquetes mapping
        const pkgSheet = workbook.Sheets['Paquetes'];
        if (pkgSheet) {
          const pkgsList = [];
          for (let r = 5; r <= 30; r++) {
            const nameCell = pkgSheet[XLSX.utils.encode_cell({ r: r - 1, c: 0 })]; // Col A
            const name = nameCell ? nameCell.v : null;
            if (!name || String(name).trim() === '') continue;

            const getRowVal = (colIdx) => {
              const cell = pkgSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            pkgsList.push({
              name: String(name).trim(),
              category: getRowVal(1) ? String(getRowVal(1)).trim() : '',
              description: getRowVal(2) ? String(getRowVal(2)).trim() : '',
              includes: getRowVal(3) ? String(getRowVal(3)).trim() : '',
              activities: []
            });
          }

          for (let r = 18; r <= 150; r++) {
            const pkgNameCell = pkgSheet[XLSX.utils.encode_cell({ r: r - 1, c: 0 })]; // Col A
            const pkgName = pkgNameCell ? String(pkgNameCell.v).trim() : null;
            if (!pkgName) continue;

            const actNameCell = pkgSheet[XLSX.utils.encode_cell({ r: r - 1, c: 1 })]; // Col B
            const actName = actNameCell ? String(actNameCell.v).trim() : null;
            if (!actName) continue;

            const getRowVal = (colIdx) => {
              const cell = pkgSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })];
              return cell ? cell.v : null;
            };

            const targetPkg = pkgsList.find(p => p.name === pkgName);
            if (targetPkg) {
              targetPkg.activities.push({
                activityName: actName,
                quantity: Number(getRowVal(2)) || 1,
                order: Number(getRowVal(3)) || 0
              });
            }
          }
          catalog.packages = pkgsList;
        }

        // Configuration mapping
        const configSheet = workbook.Sheets['Configuracion'];
        if (configSheet) {
          catalog.config = {
            complexities: [],
            priorities: [],
            environments: [],
            currencies: [],
            developmentTypes: []
          };

          const toCode = (str) => String(str).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

          // complexities (A5:B8)
          for (let r = 5; r <= 10; r++) {
            const name = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 0 })]?.v;
            const factor = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 1 })]?.v;
            if (name && factor) {
              const cleanName = String(name).trim();
              catalog.config.complexities.push({
                code: toCode(cleanName),
                name: cleanName,
                factor: Number(factor)
              });
            }
          }

          // priorities: D5:D8
          for (let r = 5; r <= 10; r++) {
            const val = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 3 })]?.v;
            if (val) {
              const cleanName = String(val).trim();
              const cleanCode = toCode(cleanName);
              const factor = cleanName.toLowerCase().includes('baja') ? 1.0 :
                             cleanName.toLowerCase().includes('media') ? 1.0 :
                             cleanName.toLowerCase().includes('alta') ? 1.10 :
                             cleanName.toLowerCase().includes('urgente') ? 1.25 : 1.0;
              catalog.config.priorities.push({
                code: cleanCode,
                name: cleanName,
                factor
              });
            }
          }

          // environments: F5:F9
          for (let r = 5; r <= 12; r++) {
            const val = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 5 })]?.v;
            if (val) {
              const cleanName = String(val).trim();
              catalog.config.environments.push({
                code: toCode(cleanName),
                name: cleanName
              });
            }
          }

          // currencies: H5:H7
          for (let r = 5; r <= 8; r++) {
            const val = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 7 })]?.v;
            if (val) {
              const cleanName = String(val).trim();
              const code = toCode(cleanName);
              const symbol = code === 'COP' ? '$' : code === 'USD' ? 'USD' : code === 'EUR' ? 'EUR' : '$';
              catalog.config.currencies.push({
                code,
                name: cleanName,
                symbol,
                active: true
              });
            }
          }

          // dev types: J5:J10
          for (let r = 5; r <= 15; r++) {
            const val = configSheet[XLSX.utils.encode_cell({ r: r - 1, c: 9 })]?.v;
            if (val) {
              const cleanName = String(val).trim();
              catalog.config.developmentTypes.push({
                code: toCode(cleanName),
                name: cleanName
              });
            }
          }
        }

        resolve({ estimation, catalog, warnings });
      } catch (err) {
        reject(new Error(`Error al leer el archivo Excel: ${err.message}`));
      }
    };
    reader.onerror = (err) => reject(new Error(`Error de lectura: ${err.message}`));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses just the catalog sheets.
 */
export const parseCatalogExcel = async (file) => {
  const result = await parseEstimationExcel(file);
  return { catalog: result.catalog, warnings: result.warnings };
};
