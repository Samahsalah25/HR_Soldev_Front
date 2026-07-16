/**
 * Utility Script: Fix Missing "home" Permission
 * ==============================================
 * 
 * المشكلة:
 * "لوحتي الشخصية" (home) مش بتظهر في Sidebar لو مش موجودة في صلاحيات الدور
 * 
 * الحل:
 * نضيف "home: true" لكل الأدوار في الـ database
 * 
 * الاستخدام:
 * import { fixHomePermissionForAllRoles } from '@/utils/fixHomePermission';
 * await fixHomePermissionForAllRoles();
 */

import { getPermissionRoles, updateRolePermissions } from '@/api/permissionsApi';

/**
 * يتأكد إن كل الأدوار عندها صلاحية "home" مفعّلة
 */
export async function fixHomePermissionForAllRoles() {
    try {
      

        // 1. جيب كل الأدوار الحالية
        const data = await getPermissionRoles();
        const rolesData = data?.data ?? data;

        if (!rolesData || typeof rolesData !== 'object') {
            console.error("❌ فشل تحميل الأدوار");
            return { success: false, error: "Failed to load roles" };
        }

        // 2. لكل دور، تأكد إن home موجودة ومفعّلة
        const updates = [];
        const roles = Object.keys(rolesData);

        for (const roleName of roles) {
            const permissions = rolesData[roleName];

            // لو home مش موجودة أو false → ضيفها/فعّلها
            if (!permissions.home) {
              
                const updatedPerms = { ...permissions, home: true };

                try {
                    await updateRolePermissions(roleName, updatedPerms);
                    updates.push(roleName);
                } catch (err) {
                    console.error(`❌ فشل تحديث ${roleName}:`, err);
                }
            } else {
                console.log(`✓ 'home' مفعّلة بالفعل لدور: ${roleName}`);
            }
        }

        if (updates.length > 0) {
           
            return { success: true, updated: updates };
        } else {
           
            return { success: true, updated: [] };
        }

    } catch (err) {
        console.error("❌ خطأ في fixHomePermissionForAllRoles:", err);
        return { success: false, error: err.message };
    }
}

/**
 * يتأكد إن دور معين عنده home مفعّلة
 */
export async function fixHomePermissionForRole(roleName) {
    try {
       

        const data = await getPermissionRoles();
        const rolesData = data?.data ?? data;

        if (!rolesData || !rolesData[roleName]) {
            console.error(`❌ الدور ${roleName} غير موجود`);
            return { success: false, error: "Role not found" };
        }

        const permissions = rolesData[roleName];

        if (!permissions.home) {
           
            const updatedPerms = { ...permissions, home: true };
            await updateRolePermissions(roleName, updatedPerms);
            return { success: true, updated: true };
        } else {
         
            return { success: true, updated: false };
        }

    } catch (err) {
        console.error(`❌ خطأ في fixHomePermissionForRole(${roleName}):`, err);
        return { success: false, error: err.message };
    }
}
